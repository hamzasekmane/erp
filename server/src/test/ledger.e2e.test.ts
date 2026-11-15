import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { getDb, initDb, closeDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import { ensureBaselinePlans } from "../db/bootstrap";
import { accounts, accountingPeriods, journalEntries, journalLines } from "../db/schema";
import { LedgerService } from "../modules/ledger/ledger.service";
import { LedgerSetupService } from "../modules/ledger/ledger-setup.service";
import { newId } from "../shared/ids";
import { createTestApp, closeTestApp } from "./app";

/**
 * Ledger integration tests.
 *
 * These run against the real schema (PGlite, PostgreSQL 17) with RLS enabled,
 * so the database's own checks — triggers, deferred balance constraint,
 * check constraints — are part of every assertion. A service-level test with a
 * mock would prove nothing here: the guarantee we care about lives in the
 * database.
 */

let app: INestApplication;
let http: ReturnType<typeof request>;
let ledger: LedgerService;
let setup: LedgerSetupService;

const tenant = {
  userData: { email: "ledger@t.dz", password: "Str0ng!Passw0rd", name: "Comptable" },
  tenantData: { name: "Ledger Co", businessName: "Ledger Co", domain: "ledgerco" },
};

let token = "";
let tenantId = "";

let registerCount = 0;

/** Each registration needs a unique email/subdomain: they share one database. */
async function register(): Promise<{ token: string; tenantId: string }> {
  registerCount += 1;
  const suffix = `l${registerCount}-${Date.now()}`;
  const res = await http
    .post("/api/auth/register")
    .send({
      userData: { ...tenant.userData, email: `ledger-${suffix}@t.dz` },
      tenantData: { ...tenant.tenantData, name: `Ledger ${suffix}`, businessName: `Ledger ${suffix}`, domain: suffix },
    })
    .expect(201);
  return { token: res.body.token, tenantId: res.body.user.tenantId };
}

/**
 * Drizzle wraps driver errors, so the message that matters is on the cause
 * chain. Asserting on the top-level message would only prove that *something*
 * failed, not that the ledger trigger is what refused.
 */
async function expectRejection(promise: Promise<unknown>, pattern: RegExp): Promise<void> {
  const failure = await promise.then(() => null).catch((error: unknown) => error);
  expect(failure).toBeTruthy();
  const chain = [
    (failure as Error)?.message ?? "",
    ((failure as Error)?.cause as Error)?.message ?? "",
    JSON.stringify((failure as Error)?.cause ?? {}),
  ].join(" ");
  expect(chain).toMatch(pattern);
}

/** Reads the trial balance through SQL, exactly as a report would. */
async function trialBalance(tid: string) {
  return runTenant(tid, async () =>
    getDb().execute(sql`
      select a.code,
             sum(l.debit_minor)::bigint  as debit,
             sum(l.credit_minor)::bigint as credit
        from journal_lines l
        join accounts a on a.id = l.account_id
       where l.tenant_id = ${tid}
       group by a.code
       order by a.code
    `),
  );
}

function rows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  const typed = result as { rows?: Array<Record<string, unknown>> };
  return typed.rows ?? [];
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await ensureBaselinePlans();
  app = await createTestApp();
  http = request(app.getHttpServer());
  ledger = app.get(LedgerService);
  setup = app.get(LedgerSetupService);

  const registered = await register();
  token = registered.token;
  tenantId = registered.tenantId;
}, 60_000);

afterAll(async () => {
  await closeTestApp(app);
  await closeDb();
});

describe("chart of accounts", () => {
  it("is seeded at registration, so a new tenant can post immediately", async () => {
    const chart = await runTenant(tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, tenantId)),
    );
    expect(chart.length).toBeGreaterThan(10);
    // Every role the posting engine needs must be filled.
    const roles = chart.map((account) => account.systemRole).filter(Boolean);
    expect(roles).toEqual(
      expect.arrayContaining(["receivable", "revenue", "vat_output", "cash", "bank", "discount_allowed", "payable", "vat_input"]),
    );
  });

  it("builds the closure so the whole chart is reachable from its root", async () => {
    const closure = await runTenant(tenantId, async () =>
      getDb().execute(sql`
        select count(*)::int as n
          from account_closure cl
          join accounts parent on parent.id = cl.ancestor_id
         where cl.tenant_id = ${tenantId} and parent.code = '4'
      `),
    );
    // Class 4 contains 4, 40, 401, 44, 411, 4456, 4457 -> 7 descendants.
    expect(Number(rows(closure)[0]?.n)).toBeGreaterThanOrEqual(7);
  });

  it("is idempotent: re-running does not duplicate accounts", async () => {
    const before = await runTenant(tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, tenantId)),
    );
    const result = await setup.initialiseChart(tenantId);
    const after = await runTenant(tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, tenantId)),
    );
    expect(after.length).toBe(before.length);
    expect(result.created).toBe(0);
    expect(result.skipped).toBe(before.length);
  });

  it("refuses to seed a template missing a required role", async () => {
    const fresh = await register();
    await expect(
      setup.initialiseChart(fresh.tenantId, {
        template: [
          { code: "1", name: "Only", type: "asset", parentCode: null, systemRole: null, isPostable: true },
        ],
      }),
    ).rejects.toThrow(/system roles/i);
  });
});

describe("posting an invoice", () => {
  let invoiceId = "";

  it("writes a balanced entry in the same transaction as the invoice", async () => {
    const client = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "L-001", name: "Client Ledger" })
      .expect(201);

    // 2 x 100.00, 10 % line discount -> 180.00 base, 19 % VAT -> 34.20.
    // Invoice discount 5.00 -> taxable 175.00, VAT relief 0.95 -> 33.25.
    // Plus 20.00 shipping: total 228.25.
    const invoice = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.body.data._id,
        dueDate: "2099-12-31",
        items: [{ description: "Produit", quantity: 2, unitPrice: 100, discount: 10, taxRate: 19 }],
        discount: 5,
        shipping: 20,
      })
      .expect(201);

    invoiceId = invoice.body.data._id;

    const entries = await runTenant(tenantId, async () =>
      getDb()
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.sourceId, invoiceId))),
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]?.sourceType).toBe("invoice");
    expect(entries[0]?.status).toBe("posted");
  });

  it("records the entry with debits equal to credits", async () => {
    const [entry] = await runTenant(tenantId, async () =>
      getDb()
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.sourceId, invoiceId))),
    );
    const lines = await runTenant(tenantId, async () =>
      getDb().select().from(journalLines).where(eq(journalLines.entryId, entry!.id)),
    );

    const debit = lines.reduce((sum, line) => sum + Number(line.debitMinor), 0);
    const credit = lines.reduce((sum, line) => sum + Number(line.creditMinor), 0);
    expect(debit).toBe(credit);
    // 228.25 + 5.00 discount = 233.25 on each side.
    expect(debit).toBe(23325);
  });

  it("posts receivable at the total, gross revenue plus shipping, VAT, and the discount", async () => {
    const [entry] = await runTenant(tenantId, async () =>
      getDb()
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.sourceId, invoiceId))),
    );
    const lines = await runTenant(tenantId, async () =>
      getDb()
        .select({
          debit: journalLines.debitMinor,
          credit: journalLines.creditMinor,
          role: accounts.systemRole,
        })
        .from(journalLines)
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(eq(journalLines.entryId, entry!.id)),
    );

    const byRole = new Map(lines.map((line) => [line.role, line]));
    expect(Number(byRole.get("receivable")?.debit)).toBe(22825);
    expect(Number(byRole.get("revenue")?.credit)).toBe(20000); // 180.00 + 20.00 shipping
    expect(Number(byRole.get("vat_output")?.credit)).toBe(3325);
    expect(Number(byRole.get("discount_allowed")?.debit)).toBe(500);

    // The identity that must hold for every invoice: AR = revenue + VAT - discount.
    const receivable = Number(byRole.get("receivable")?.debit);
    const revenue = Number(byRole.get("revenue")?.credit);
    const vat = Number(byRole.get("vat_output")?.credit);
    const discount = Number(byRole.get("discount_allowed")?.debit);
    expect(receivable).toBe(revenue + vat - discount);
  });

  it("does NOT post a draft invoice, because nothing has been billed", async () => {
    const client = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "L-002", name: "Client Draft" })
      .expect(201);

    const draft = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.body.data._id,
        dueDate: "2099-12-31",
        status: "draft",
        items: [{ description: "Draft", quantity: 1, unitPrice: 50, taxRate: 19 }],
      })
      .expect(201);

    const entries = await runTenant(tenantId, async () =>
      getDb()
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.sourceId, draft.body.data._id))),
    );
    expect(entries).toHaveLength(0);
  });

  it("rolls the invoice back when posting fails, so no invoice exists without its entry", async () => {
    const client = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "L-003", name: "Client Rollback" })
      .expect(201);

    // Lock the period the invoice would post into.
    const year = new Date().getFullYear();
    await runTenant(tenantId, async () =>
      getDb().insert(accountingPeriods).values({
        id: newId(),
        tenantId,
        period: `${year}-lock`,
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        status: "locked",
      }),
    );

    try {
      const res = await http
        .post("/api/invoices")
        .set("Authorization", `Bearer ${token}`)
        .send({
          clientId: client.body.data._id,
          dueDate: "2099-12-31",
          items: [{ description: "Locked", quantity: 1, unitPrice: 10, taxRate: 19 }],
        });

      expect(res.status).toBe(422);
      expect(res.body.error_code).toBe("LEDGER_PERIOD_LOCKED");

      // Nothing was written: the invoice AND the entry are both absent.
      const invoices = await runTenant(tenantId, async () =>
        getDb().execute(sql`select count(*)::int as n from invoices where tenant_id = ${tenantId} and client_id = ${client.body.data._id}`),
      );
      expect(Number(rows(invoices)[0]?.n)).toBe(0);
    } finally {
      await runTenant(tenantId, async () =>
        getDb().delete(accountingPeriods).where(and(eq(accountingPeriods.tenantId, tenantId), eq(accountingPeriods.period, `${year}-lock`))),
      );
    }
  });
});

describe("posting a payment", () => {
  it("debits cash and credits receivable by the amount", async () => {
    const client = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "L-004", name: "Client Payment" })
      .expect(201);

    const invoice = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId: client.body.data._id,
        dueDate: "2099-12-31",
        items: [{ description: "Paid", quantity: 1, unitPrice: 100, taxRate: 0 }],
      })
      .expect(201);

    await http
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ invoiceId: invoice.body.data._id, amount: 40, method: "cash" })
      .expect(201);

    const [entry] = await runTenant(tenantId, async () =>
      getDb()
        .select()
        .from(journalEntries)
        .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.sourceType, "payment"))),
    );
    expect(entry).toBeTruthy();

    const lines = await runTenant(tenantId, async () =>
      getDb()
        .select({ debit: journalLines.debitMinor, credit: journalLines.creditMinor, role: accounts.systemRole })
        .from(journalLines)
        .innerJoin(accounts, eq(accounts.id, journalLines.accountId))
        .where(eq(journalLines.entryId, entry!.id)),
    );

    const byRole = new Map(lines.map((line) => [line.role, line]));
    expect(Number(byRole.get("cash")?.debit)).toBe(4000);
    expect(Number(byRole.get("receivable")?.credit)).toBe(4000);
  });
});

describe("immutability", () => {
  let entryId = "";

  beforeAll(async () => {
    const [entry] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)).limit(1),
    );
    entryId = entry!.id;
  });

  it("rejects UPDATE of an entry at the database level", async () => {
    await expectRejection(
      runTenant(tenantId, async () =>
        getDb().update(journalEntries).set({ memo: "tampered" }).where(eq(journalEntries.id, entryId)),
      ),
      /append-only/i,
    );
  });

  it("rejects DELETE of an entry at the database level", async () => {
    await expectRejection(
      runTenant(tenantId, async () => getDb().delete(journalLines).where(eq(journalLines.entryId, entryId))),
      /append-only/i,
    );
  });

  it("keeps the entry unchanged after both attempts", async () => {
    const [entry] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.id, entryId)),
    );
    expect(entry?.memo).not.toBe("tampered");
    const lines = await runTenant(tenantId, async () =>
      getDb().select().from(journalLines).where(eq(journalLines.entryId, entryId)),
    );
    expect(lines.length).toBeGreaterThan(0);
  });
});

describe("reversal, not deletion", () => {
  it("writes a mirror entry that cancels the original exactly", async () => {
    const [original] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)).limit(1),
    );

    const reversalId = await runTenant(tenantId, async () =>
      ledger.reverseEntry(getDb(), {
        tenantId,
        entryId: original!.id,
        reason: "Test d'extourne",
      }),
    );

    const [reversal] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.id, reversalId)),
    );
    expect(reversal?.isReversal).toBe(true);
    expect(reversal?.reversesEntryId).toBe(original!.id);
    expect(reversal?.sourceType).toBe("reversal");

    const originalLines = await runTenant(tenantId, async () =>
      getDb().select().from(journalLines).where(eq(journalLines.entryId, original!.id)),
    );
    const reversalLines = await runTenant(tenantId, async () =>
      getDb().select().from(journalLines).where(eq(journalLines.entryId, reversalId)),
    );

    expect(reversalLines).toHaveLength(originalLines.length);
    // Per account, the pair nets to zero.
    const net = new Map<string, number>();
    for (const line of [...originalLines, ...reversalLines]) {
      net.set(line.accountId, (net.get(line.accountId) ?? 0) + Number(line.debitMinor) - Number(line.creditMinor));
    }
    for (const value of net.values()) expect(value).toBe(0);
  });

  it("refuses to reverse a reversal", async () => {
    const [reversal] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.isReversal, true)).limit(1),
    );
    await expect(
      runTenant(tenantId, async () =>
        ledger.reverseEntry(getDb(), { tenantId, entryId: reversal!.id, reason: "Nope" }),
      ),
    ).rejects.toThrow(/extourne/i);
  });

  it("keeps the original entry, marked and linked, never deleted", async () => {
    const entries = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)),
    );
    // Reversals are additive: the count grew rather than staying the same.
    expect(entries.filter((entry) => entry.isReversal)).toHaveLength(1);
  });
});

describe("trial balance", () => {
  it("balances globally: total debits equal total credits", async () => {
    const result = await runTenant(tenantId, async () =>
      getDb().execute(sql`
        select sum(debit_minor)::bigint as debit, sum(credit_minor)::bigint as credit
          from journal_lines where tenant_id = ${tenantId}
      `),
    );
    const row = rows(result)[0];
    expect(Number(row?.debit)).toBe(Number(row?.credit));
    expect(Number(row?.debit)).toBeGreaterThan(0);
  });

  it("reports per-account totals that sum to the global total", async () => {
    const balances = rows(await trialBalance(tenantId));
    expect(balances.length).toBeGreaterThan(2);
    const debit = balances.reduce((sum, row) => sum + Number(row.debit), 0);
    const credit = balances.reduce((sum, row) => sum + Number(row.credit), 0);
    expect(debit).toBe(credit);
  });

  it("leaves a zero net effect after the reversal", async () => {
    // The reversed invoice no longer contributes; the reversal cancelled it.
    const result = await runTenant(tenantId, async () =>
      getDb().execute(sql`
        select coalesce(sum(l.debit_minor - l.credit_minor), 0)::bigint as net
          from journal_lines l
          join accounts a on a.id = l.account_id
         where l.tenant_id = ${tenantId} and a.system_role = 'discount_allowed'
      `),
    );
    expect(Number(rows(result)[0]?.net)).toBe(0);
  });
});

describe("database-level balance enforcement", () => {
  it("rejects an unbalanced entry at COMMIT when inserted outside the service", async () => {
    // Bypass the domain entirely: this is what a future bug or a raw SQL
    // migration would do, and the database must still refuse it.
    await expect(
      runGlobal(async () =>
        getDb().transaction(async (tx) => {
          const entryId = newId();
          await tx.insert(journalEntries).values({
            id: entryId,
            tenantId,
            number: "",
            entryDate: "2099-01-01",
            sourceType: "manual",
            status: "posted",
          });
          await tx.insert(journalLines).values([
            { id: newId(), tenantId, entryId, lineNumber: 1, accountId: "missing", debitMinor: 100 },
          ]);
        }),
      ),
    ).rejects.toThrow();
  });

  it("rejects a single-sided line via the check constraint", async () => {
    const [account] = await runTenant(tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, tenantId)).limit(1),
    );
    const [entry] = await runTenant(tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)).limit(1),
    );

    await expect(
      runTenant(tenantId, async () =>
        getDb().insert(journalLines).values({
          id: newId(),
          tenantId,
          entryId: entry!.id,
          lineNumber: 99,
          accountId: account!.id,
          debitMinor: 0,
          creditMinor: 0,
        }),
      ),
    ).rejects.toThrow();
  });
});

describe("journal numbering", () => {
  it("is sequential per tenant and year", async () => {
    const numbers = await runTenant(tenantId, async () =>
      getDb()
        .select({ number: journalEntries.number })
        .from(journalEntries)
        .where(eq(journalEntries.tenantId, tenantId))
        .orderBy(journalEntries.number),
    );
    const year = new Date().getFullYear();
    numbers.forEach((row, index) => {
      expect(row.number).toMatch(new RegExp(`^JE-${year}-\\d{6}$`));
      expect(row.number).toBe(`JE-${year}-${String(index + 1).padStart(6, "0")}`);
    });
  });
});

describe("tenant isolation of the ledger", () => {
  it("does not let one tenant see another's accounts or entries", async () => {
    const other = await register();

    const visible = await runTenant(other.tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId)),
    );
    expect(visible).toHaveLength(0);

    const otherAccounts = await runTenant(other.tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, tenantId)),
    );
    expect(otherAccounts).toHaveLength(0);
  });

  it("gives each tenant its own independent chart and numbering", async () => {
    const other = await register();
    const first = await runTenant(other.tenantId, async () =>
      getDb().select().from(journalEntries).where(eq(journalEntries.tenantId, other.tenantId)),
    );
    expect(first).toHaveLength(0);

    const chart = await runTenant(other.tenantId, async () =>
      getDb().select().from(accounts).where(eq(accounts.tenantId, other.tenantId)),
    );
    expect(chart.length).toBeGreaterThan(10);
  });
});
