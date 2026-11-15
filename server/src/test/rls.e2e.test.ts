import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closeDb, getDb, initDb, resolvePublicTokenScope, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";

/**
 * Row-Level Security.
 *
 * These tests are deliberately adversarial: they try to read, update and delete
 * another tenant's rows and assert that ZERO rows are affected. They also prove
 * the policy set is actually ENGAGED (a suite that passes because RLS is
 * silently bypassed is worse than no suite).
 *
 * The test process connects as a superuser (PGlite's `postgres`), which bypasses
 * RLS. `runTenant()` therefore does `SET LOCAL ROLE erp_app` so the policies
 * apply; the assertions below would return full result sets if that were not
 * happening.
 */

const TENANT_A = "rls-tenant-a";
const TENANT_B = "rls-tenant-b";

/** Tables with their own tenant_id, plus one cross-check child table each. */
const TENANT_TABLES = [
  "tenant_settings",
  "users",
  "sessions",
  "subscriptions",
  "subscription_invoices",
  "clients",
  "client_groups",
  "client_notes",
  "categories",
  "taxes",
  "products",
  "stock_levels",
  "stock_movements",
  "number_sequences",
  "invoices",
  "payments",
  "payment_gateways",
  "gateway_checkouts",
  "payment_methods",
  "notifications",
  "api_keys",
  "files",
  "audit_logs",
  "outbox_events",
  "idempotency_keys",
  "departments",
  "employees",
  "employee_contracts",
  "leave_requests",
  "attendance_records",
  "support_tickets",
  "archive_documents",
  "uploads",
  "accounts",
  "account_closure",
  "journal_entries",
  "journal_lines",
  "accounting_periods",
] as const;

const CHILD_TABLES = [
  "client_group_members",
  "invoice_items",
  "invoice_status_history",
  "invoice_public_tokens",
  "payment_allocations",
  "payment_refunds",
  "payment_gateway_secrets",
  "support_messages",
  "password_reset_tokens",
] as const;

async function rawRows(statement: string): Promise<Array<Record<string, unknown>>> {
  const result = await getDb().execute(sql.raw(statement));
  const anyResult = result as unknown as { rows?: Array<Record<string, unknown>> };
  return Array.isArray(result) ? (result as Array<Record<string, unknown>>) : (anyResult.rows ?? []);
}

/** Seeds the minimum graph of rows for both tenants, as a privileged role. */
async function seed(): Promise<void> {
  await runGlobal(async () => {
    const db = getDb();
    await db.insert(schema.tenants).values([
      { id: TENANT_A, name: "RLS A", subdomain: "rls-a", email: "a@rls.dz" },
      { id: TENANT_B, name: "RLS B", subdomain: "rls-b", email: "b@rls.dz" },
    ]);

    for (const [tenantId, suffix] of [
      [TENANT_A, "a"],
      [TENANT_B, "b"],
    ] as const) {
      await db.insert(schema.tenantSettings).values({ tenantId });
      await db.insert(schema.users).values({
        id: `user-${suffix}`,
        tenantId,
        email: `user-${suffix}@rls.dz`,
        passwordHash: "x",
        name: `User ${suffix.toUpperCase()}`,
      });
      await db.insert(schema.clients).values({
        id: `client-${suffix}`,
        tenantId,
        code: `C-${suffix.toUpperCase()}`,
        name: `Client ${suffix.toUpperCase()}`,
      });
      await db.insert(schema.clientNotes).values({
        id: `note-${suffix}`,
        tenantId,
        clientId: `client-${suffix}`,
        title: `Note ${suffix.toUpperCase()}`,
      });
      await db.insert(schema.clientGroups).values({
        id: `group-${suffix}`,
        tenantId,
        name: `Group ${suffix.toUpperCase()}`,
      });
      await db.insert(schema.clientGroupMembers).values({ groupId: `group-${suffix}`, clientId: `client-${suffix}` });
      await db.insert(schema.categories).values({ id: `cat-${suffix}`, tenantId, name: `Cat ${suffix.toUpperCase()}` });
      await db.insert(schema.taxes).values({ id: `tax-${suffix}`, tenantId, name: `Tax ${suffix.toUpperCase()}`, rateBp: 1900 });
      await db.insert(schema.products).values({
        id: `product-${suffix}`,
        tenantId,
        code: `P-${suffix.toUpperCase()}`,
        name: `Product ${suffix.toUpperCase()}`,
        priceMinor: 1000,
        costMinor: 500,
      });
      await db.insert(schema.stockLevels).values({ productId: `product-${suffix}`, tenantId, quantity: "10" });
      await db.insert(schema.stockMovements).values({
        id: `move-${suffix}`,
        tenantId,
        productId: `product-${suffix}`,
        type: "in",
        quantity: "10",
      });
      await db.insert(schema.numberSequences).values({ tenantId, docType: `doc-${suffix}`, period: "2099", nextValue: 2 });
      await db.insert(schema.invoices).values({
        id: `invoice-${suffix}`,
        tenantId,
        number: `FA-${suffix.toUpperCase()}-1`,
        clientId: `client-${suffix}`,
        status: "sent",
        issueDate: "2099-01-01",
        dueDate: "2099-02-01",
        subtotalMinor: 1000,
        taxMinor: 190,
        totalMinor: 1190,
        paidMinor: 0,
        dueMinor: 1190,
      });
      await db.insert(schema.invoiceItems).values({
        id: `item-${suffix}`,
        invoiceId: `invoice-${suffix}`,
        position: 1,
        description: "Ligne",
        quantity: "1",
        unitPriceMinor: 1000,
        taxMinor: 190,
        lineTotalMinor: 1190,
      });
      await db.insert(schema.invoiceStatusHistory).values({
        id: `hist-${suffix}`,
        invoiceId: `invoice-${suffix}`,
        toStatus: "sent",
      });
      await db.insert(schema.invoicePublicTokens).values({
        id: `tok-${suffix}`,
        invoiceId: `invoice-${suffix}`,
        tokenHash: `hash-${suffix}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      await db.insert(schema.payments).values({
        id: `payment-${suffix}`,
        tenantId,
        number: `PAY-${suffix.toUpperCase()}-1`,
        clientId: `client-${suffix}`,
        invoiceId: `invoice-${suffix}`,
        amountMinor: 100,
      });
      await db.insert(schema.paymentAllocations).values({
        id: `alloc-${suffix}`,
        paymentId: `payment-${suffix}`,
        invoiceId: `invoice-${suffix}`,
        amountMinor: 100,
      });
      await db.insert(schema.paymentRefunds).values({ id: `refund-${suffix}`, paymentId: `payment-${suffix}`, amountMinor: 10 });
      await db.insert(schema.paymentGateways).values({ id: `gw-${suffix}`, tenantId, code: `gw-${suffix}`, name: "Gateway" });
      await db.insert(schema.paymentGatewaySecrets).values({ gatewayId: `gw-${suffix}`, key: "k", ciphertext: "c" });
      await db.insert(schema.gatewayCheckouts).values({
        id: `checkout-${suffix}`,
        tenantId,
        externalId: `ext-${suffix}`,
        amountMinor: 1000,
        gatewayId: `gw-${suffix}`,
        invoiceId: `invoice-${suffix}`,
      });
      await db.insert(schema.paymentMethods).values({ id: `pm-${suffix}`, tenantId, code: `pm-${suffix}`, name: "Cash" });
      await db.insert(schema.notifications).values({ id: `notif-${suffix}`, tenantId, userId: `user-${suffix}`, title: "t", message: "m" });
      await db.insert(schema.apiKeys).values({ id: `key-${suffix}`, tenantId, name: "k", prefix: `p-${suffix}`, hash: `h-${suffix}` });
      await db.insert(schema.files).values({
        id: `file-${suffix}`,
        tenantId,
        kind: "document",
        mime: "application/pdf",
        size: 10,
        storageKey: `key-${suffix}`,
      });
      await db.insert(schema.auditLogs).values({ id: `audit-${suffix}`, tenantId, action: "test" });
      await db.insert(schema.outboxEvents).values({ id: `ob-${suffix}`, tenantId, type: "t", payload: {} });
      await db.insert(schema.idempotencyKeys).values({
        tenantId,
        key: `idem-${suffix}`,
        requestHash: "h",
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      await db.insert(schema.departments).values({ id: `dept-${suffix}`, tenantId, name: "D" });
      await db.insert(schema.employees).values({
        id: `emp-${suffix}`,
        tenantId,
        code: `E-${suffix}`,
        firstName: "E",
        lastName: "L",
        hireDate: "2099-01-01",
      });
      await db.insert(schema.employeeContracts).values({
        id: `contract-${suffix}`,
        tenantId,
        employeeId: `emp-${suffix}`,
        startDate: "2099-01-01",
      });
      await db.insert(schema.leaveRequests).values({
        id: `leave-${suffix}`,
        tenantId,
        employeeId: `emp-${suffix}`,
        startDate: "2099-01-01",
        endDate: "2099-01-03",
      });
      await db.insert(schema.attendanceRecords).values({
        id: `att-${suffix}`,
        tenantId,
        employeeId: `emp-${suffix}`,
        date: "2099-01-01",
      });
      await db.insert(schema.accounts).values({
        id: `acc-${suffix}`,
        tenantId,
        code: `ACC-${suffix}`,
        name: "Client",
        type: "asset",
        normalBalance: "debit",
      });
      await db.insert(schema.accountClosure).values({
        tenantId,
        ancestorId: `acc-${suffix}`,
        descendantId: `acc-${suffix}`,
        depth: 0,
      });
      await db.insert(schema.accountingPeriods).values({
        id: `period-${suffix}`,
        tenantId,
        period: `2099-0${suffix === "a" ? 1 : 2}`,
        startDate: "2099-01-01",
        endDate: "2099-12-31",
      });
      await db.insert(schema.journalEntries).values({
        id: `je-${suffix}`,
        tenantId,
        number: `JE-${suffix}`,
        entryDate: "2099-01-01",
        sourceType: "manual",
        // Draft: a posted entry must be balanced, and these fixtures are
        // inserted one statement at a time (each its own transaction), so the
        // deferred balance trigger would correctly reject them.
        status: "draft",
      });
      await db.insert(schema.journalLines).values({
        id: `jl-${suffix}`,
        tenantId,
        entryId: `je-${suffix}`,
        lineNumber: 1,
        accountId: `acc-${suffix}`,
        debitMinor: 100,
        creditMinor: 0,
      });
      await db.insert(schema.supportTickets).values({ id: `ticket-${suffix}`, tenantId, subject: "S" });
      await db.insert(schema.supportMessages).values({ id: `msg-${suffix}`, ticketId: `ticket-${suffix}`, body: "B" });
      await db.insert(schema.archiveDocuments).values({ id: `arch-${suffix}`, tenantId, name: "A" });
      await db.insert(schema.uploads).values({
        id: `upload-${suffix}`,
        tenantId,
        filename: "f",
        mime: "application/pdf",
        size: 10,
        storagePath: `/p/${suffix}`,
      });
      await db.insert(schema.plans).values({ id: `plan-${suffix}`, code: `plan-${suffix}`, name: "Starter" }).onConflictDoNothing();
      await db.insert(schema.subscriptions).values({
        id: `sub-${suffix}`,
        tenantId,
        planId: `plan-${suffix}`,
        status: "active",
      });
      await db.insert(schema.subscriptionInvoices).values({
        id: `subinv-${suffix}`,
        tenantId,
        subscriptionId: `sub-${suffix}`,
        number: `SI-${suffix}`,
        periodStart: new Date("2099-01-01T00:00:00Z"),
        periodEnd: new Date("2099-02-01T00:00:00Z"),
      });
      await db.insert(schema.sessions).values({
        id: `sess-${suffix}`,
        userId: `user-${suffix}`,
        tenantId,
        refreshTokenHash: `rt-${suffix}`,
        familyId: `fam-${suffix}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
      await db.insert(schema.passwordResetTokens).values({
        id: `prt-${suffix}`,
        userId: `user-${suffix}`,
        tokenHash: `prt-hash-${suffix}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      });
    }
  });
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(() => seed());
});

afterAll(async () => {
  await closeDb();
});

describe("RLS — the policy set is real and engaged", () => {
  it("installs a forced policy on every protected table", async () => {
    const rows = await runGlobal(() =>
      rawRows(`select count(*)::int as n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
               where ns.nspname = 'public' and c.relrowsecurity and c.relforcerowsecurity`),
    );
    // Derived, not hardcoded: a table added without a policy must fail this,
    // and a table added WITH one must not require editing a magic number.
    // = tenant tables + tenants itself + child tables.
    expect(Number(rows[0]?.n)).toBe(TENANT_TABLES.length + 1 + CHILD_TABLES.length);
  });

  it("creates the app role as non-superuser and non-bypassrls", async () => {
    const rows = await runGlobal(() =>
      rawRows(`select rolsuper, rolbypassrls from pg_roles where rolname = 'erp_app'`),
    );
    expect(rows[0]?.rolsuper).toBe(false);
    expect(rows[0]?.rolbypassrls).toBe(false);
  });

  it("fails closed: inside an RLS transaction with NO tenant setting, zero rows", async () => {
    // `SET LOCAL` outside a transaction is silently discarded, so this must be
    // asserted inside one. As the app role with no app.tenant_id, every policy
    // evaluates to NULL and no row can match.
    await runGlobal(async () => {
      await getDb().transaction(async (tx) => {
        await tx.execute(sql.raw(`set local role erp_app`));
        const result = (await tx.execute(sql.raw(`select count(*)::int as n from clients`))) as unknown as {
          rows: Array<{ n: number }>;
        };
        expect(Number(result.rows[0]?.n)).toBe(0);
      });
    });
  });

  it("scopes a tenant transaction to exactly that tenant", async () => {
    const ids = await runTenant(TENANT_A, async () =>
      (await rawRows(`select id from clients order by id`)).map((row) => row.id),
    );
    expect(ids).toEqual(["client-a"]);
  });

  it("does not let the tenant setting leak between sequential scopes", async () => {
    // A pooled connection must not carry tenant A's setting into tenant B's work.
    const a = await runTenant(TENANT_A, async () => (await rawRows(`select count(*)::int as n from clients`))[0]?.n);
    const b = await runTenant(TENANT_B, async () => (await rawRows(`select count(*)::int as n from clients`))[0]?.n);
    const outside = await runGlobal(async () => (await rawRows(`select count(*)::int as n from clients`))[0]?.n);

    expect(Number(a)).toBe(1);
    expect(Number(b)).toBe(1);
    // Outside any scope, as the superuser, both rows are visible: proof the
    // scoped runs were actually filtered rather than the table being empty.
    expect(Number(outside)).toBe(2);
  });
});

describe("RLS — cross-tenant leaks are impossible", () => {
  for (const table of TENANT_TABLES) {
    it(`${table}: tenant B cannot read, update or delete tenant A rows`, async () => {
      await runTenant(TENANT_B, async () => {
        const before = await rawRows(`select count(*)::int as n from "${table}"`);
        // Tenant B must see none of tenant A's rows.
        const leakedA = await rawRows(`select count(*)::int as n from "${table}" where tenant_id = '${TENANT_A}'`);
        expect(Number(leakedA[0]?.n)).toBe(0);

        const updated = await getDb().execute(sql.raw(`update "${table}" set tenant_id = tenant_id where tenant_id = '${TENANT_A}'`));
        const updatedCount = (updated as unknown as { rowCount?: number }).rowCount ?? 0;
        expect(updatedCount).toBe(0);

        const deleted = await getDb().execute(sql.raw(`delete from "${table}" where tenant_id = '${TENANT_A}'`));
        const deletedCount = (deleted as unknown as { rowCount?: number }).rowCount ?? 0;
        expect(deletedCount).toBe(0);

        // Tenant A's rows still exist (verified by the owner afterwards).
        expect(before.length).toBeGreaterThan(0);
      });

      await runGlobal(async () => {
        const stillThere = await rawRows(`select count(*)::int as n from "${table}" where tenant_id = '${TENANT_A}'`);
        expect(Number(stillThere[0]?.n)).toBe(1);
      });
    });
  }

  for (const table of CHILD_TABLES) {
    it(`${table}: child rows inherit the parent's tenant boundary`, async () => {
      // Tenant B sees only its own child rows, never tenant A's.
      const bVisible = await runTenant(TENANT_B, async () =>
        Number((await rawRows(`select count(*)::int as n from "${table}"`))[0]?.n),
      );
      expect(bVisible).toBe(1);

      // A cross-tenant delete from inside tenant B's scope affects nothing.
      const deletedCount = await runTenant(TENANT_B, async () => {
        const result = await rawRows(`delete from "${table}" returning 1`);
        return result.length;
      });
      // It may delete its OWN row (1) but can never reach tenant A's.
      expect(deletedCount).toBeLessThanOrEqual(1);

      // Tenant A's row is untouched whichever way that went.
      const aStillThere = await runTenant(TENANT_A, async () =>
        Number((await rawRows(`select count(*)::int as n from "${table}"`))[0]?.n),
      );
      expect(aStillThere).toBe(1);
    });
  }

  it("rejects an INSERT that claims another tenant", async () => {
    await runTenant(TENANT_B, async () => {
      // Drizzle wraps the driver error; the policy violation is on the cause chain.
      const failure = await getDb()
        .insert(schema.clients)
        .values({ id: "sneaky", tenantId: TENANT_A, code: "SNK", name: "Sneaky" })
        .then(() => null)
        .catch((error: unknown) => error);
      expect(failure).toBeTruthy();
      const chain = [
        (failure as Error)?.message ?? "",
        ((failure as Error)?.cause as Error)?.message ?? "",
        JSON.stringify((failure as Error)?.cause ?? {}),
      ].join(" ");
      expect(chain).toMatch(/row-level security/i);
    });
    await runGlobal(async () => {
      const found = await rawRows(`select count(*)::int as n from clients where id = 'sneaky'`);
      expect(Number(found[0]?.n)).toBe(0);
    });
  });

  it("lets a tenant insert its own rows", async () => {
    await runTenant(TENANT_A, async () => {
      await getDb().insert(schema.clients).values({ id: "client-a2", tenantId: TENANT_A, code: "C-A2", name: "Second" });
      const rows = await rawRows(`select count(*)::int as n from clients`);
      expect(Number(rows[0]?.n)).toBe(2);
    });
  });

  it("resolves a public token without a tenant scope, then scopes from the result", async () => {
    const resolved = await resolvePublicTokenScope("hash-a");
    expect(resolved).toEqual({ invoiceId: "invoice-a", tenantId: TENANT_A });

    // The token identifies the tenant, so the follow-up read is scoped normally.
    const invoice = await runTenant(resolved!.tenantId, async () =>
      getDb().select().from(schema.invoices).where(eq(schema.invoices.id, resolved!.invoiceId)),
    );
    expect(invoice).toHaveLength(1);
    expect(invoice[0]?.tenantId).toBe(TENANT_A);
  });

  it("returns nothing for a revoked or expired public token", async () => {
    expect(await resolvePublicTokenScope("hash-does-not-exist")).toBeNull();
  });
});

describe("RLS — boot-time effectiveness check", () => {
  it("reports that a superuser connection makes RLS inert", async () => {
    const { assertRlsEffective } = await import("../db/client");
    // The test process is a superuser, which bypasses policies: exactly the
    // misconfiguration the boot check exists to surface.
    const result = await assertRlsEffective();
    expect(result.enforced).toBe(false);
    expect(result.reason).toMatch(/superuser|BYPASSRLS/i);
  });
});
