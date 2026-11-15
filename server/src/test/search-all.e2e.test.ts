import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { resetTenants } from "./db-cleanup";
import { closeDb, getDb, initDb, runGlobal, runTenant } from "../db/client";
import { migrate } from "../db/migrate";
import * as schema from "../db/schema";
import { AdminService } from "../modules/admin/admin.service";
import { ArchivesService } from "../modules/archives/archives.service";
import { ClientNotesService } from "../modules/client-notes/client-notes.service";
import { HrService } from "../modules/hr/hr.service";
import { InvoicesService } from "../modules/invoices/invoices.service";
import { PaymentsService } from "../modules/payments/payments.service";
import { SupportService } from "../modules/support/support.service";
import { UsersService } from "../modules/users/users.service";

/**
 * The remaining search paths, exercised through their real services.
 *
 * This exists because a search refactor is exactly the kind of change that
 * passes every unit test while one of eight call sites still runs the old query
 * — or, worse, was "fixed" into a form that compiles and returns nothing. Each
 * case here is the user-visible behaviour: a differently-spelled name must be
 * found through that module's own list method, including the two that search
 * across a JOIN.
 */

const TENANT = "search-more-tenant";
const OTHER = "search-more-other";
const ctx = { tenantId: TENANT };
const base = { page: 1, limit: 50, offset: 0 };

const users = new UsersService();
const notes = new ClientNotesService();
const support = new SupportService();
const archives = new ArchivesService();
const hr = new HrService();
const payments = new PaymentsService({} as never);
const invoices = new InvoicesService(payments, {} as never);
const admin = new AdminService();

function idsOf(result: { items: Array<Record<string, unknown>> }): string[] {
  return result.items.map((item) => String(item.id ?? (item as { tenant?: { id: string } }).tenant?.id));
}

beforeAll(async () => {
  await initDb();
  await migrate();
  await runGlobal(async () => {
    await resetTenants([TENANT, OTHER]);
    await getDb().insert(schema.tenants).values([
      { id: TENANT, name: "Search More", subdomain: "smore", email: "s@smore.dz" },
      { id: OTHER, name: "مؤسسة أخرى", subdomain: "other", email: "o@other.dz" },
    ]);
  });

  await runTenant(TENANT, async () => {
    const db = getDb();
    await db.insert(schema.clients).values({
      id: "cl-main",
      tenantId: TENANT,
      code: "CL-M",
      name: "مؤسسة المصطفى",
      email: "contact@mostafa.dz",
    });
    await db.insert(schema.users).values([
      { id: "u-ahmed", tenantId: TENANT, email: "ahmed@erp.dz", passwordHash: "x", name: "أحمد المسؤول" },
      { id: "u-other", tenantId: TENANT, email: "zineb@erp.dz", passwordHash: "x", name: "زينب" },
    ]);
    await db.insert(schema.clientNotes).values([
      { id: "n-one", tenantId: TENANT, clientId: "cl-main", title: "ملاحظة عن التسليم", content: "الطلب متأخر" },
      { id: "n-two", tenantId: TENANT, clientId: "cl-main", title: "Autre", content: "Rien" },
    ]);
    await db.insert(schema.supportTickets).values([
      { id: "t-one", tenantId: TENANT, subject: "مشكلة في الفاتورة", description: "لا يمكن الطباعة" },
      { id: "t-two", tenantId: TENANT, subject: "Autre", description: "Rien" },
    ]);
    await db.insert(schema.archiveDocuments).values([
      { id: "a-one", tenantId: TENANT, name: "تقرير سنوي", description: "Exercice 2026" },
      { id: "a-two", tenantId: TENANT, name: "Autre", description: null },
    ]);
    await db.insert(schema.departments).values({ id: "d-one", tenantId: TENANT, name: "Production" });
    await db.insert(schema.employees).values([
      {
        id: "e-one",
        tenantId: TENANT,
        code: "EMP-1",
        firstName: "مصطفى",
        lastName: "بن علي",
        hireDate: "2026-01-01",
        departmentId: "d-one",
      },
      {
        id: "e-two",
        tenantId: TENANT,
        code: "EMP-2",
        firstName: "Yacine",
        lastName: "Haddad",
        hireDate: "2026-01-01",
      },
    ]);
    await db.insert(schema.invoices).values({
      id: "inv-one",
      tenantId: TENANT,
      number: "FA-2026-001",
      clientId: "cl-main",
      status: "sent",
      issueDate: "2026-01-01",
      dueDate: "2026-02-01",
      subtotalMinor: 1000,
      taxMinor: 190,
      totalMinor: 1190,
      paidMinor: 0,
      dueMinor: 1190,
    });
    await db.insert(schema.payments).values({
      id: "pay-one",
      tenantId: TENANT,
      number: "PAY-2026-001",
      clientId: "cl-main",
      invoiceId: "inv-one",
      amountMinor: 1190,
      reference: "Virement المصطفى",
    });
  });
});

afterAll(async () => {
  await closeDb();
});

describe("users", () => {
  it("finds a name written without the hamza", async () => {
    const result = await users.list(ctx, { ...base, search: "احمد" });
    expect(idsOf(result)).toEqual(["u-ahmed"]);
  });

  it("still finds by email", async () => {
    expect(idsOf(await users.list(ctx, { ...base, search: "zineb@erp.dz" }))).toEqual(["u-other"]);
  });
});

describe("client notes", () => {
  it("finds by title across the taa marbuta fold", async () => {
    // Stored "ملاحظة"; searched with haa.
    expect(idsOf(await notes.list(ctx, { ...base, search: "ملاحظه" }))).toEqual(["n-one"]);
  });

  it("finds by content", async () => {
    expect(idsOf(await notes.list(ctx, { ...base, search: "متأخر" }))).toEqual(["n-one"]);
  });
});

describe("support tickets", () => {
  it("finds by subject", async () => {
    expect(idsOf(await support.list(ctx, { ...base, search: "الفاتوره" }))).toEqual(["t-one"]);
  });

  it("finds by description", async () => {
    expect(idsOf(await support.list(ctx, { ...base, search: "الطباعه" }))).toEqual(["t-one"]);
  });
});

describe("archive documents", () => {
  it("finds by name and ignores a null description", async () => {
    expect(idsOf(await archives.list(ctx, { ...base, search: "تقرير" }))).toEqual(["a-one"]);
    // A row with a NULL description must not break the trigger or the search.
    expect(idsOf(await archives.list(ctx, { ...base, search: "Exercice" }))).toEqual(["a-one"]);
    expect(idsOf(await archives.list(ctx, { ...base, search: "zzz" }))).toEqual([]);
  });
});

describe("employees", () => {
  it("finds a first name written with alef maqsura", async () => {
    // Stored مصطفى (maqsura); searched with yaa.
    expect(idsOf(await hr.listEmployees(ctx, { ...base, search: "مصطفي" }))).toEqual(["e-one"]);
  });

  it("finds by last name, which is a separate column", async () => {
    // The trigger concatenates first_name and last_name, so a query on either
    // must work through the same column.
    expect(idsOf(await hr.listEmployees(ctx, { ...base, search: "بن علي" }))).toEqual(["e-one"]);
    expect(idsOf(await hr.listEmployees(ctx, { ...base, search: "haddad" }))).toEqual(["e-two"]);
  });
});

describe("invoices — search across a JOIN", () => {
  it("finds by invoice number", async () => {
    expect(idsOf(await invoices.list(ctx, { ...base, search: "FA-2026" }))).toContain("inv-one");
  });

  it("finds by the client's name, which lives in another table", async () => {
    // The join case: invoices.search_text only holds the number. The client is
    // matched through its own normalized column.
    expect(idsOf(await invoices.list(ctx, { ...base, search: "المصطفي" }))).toContain("inv-one");
  });

  it("finds by the client's email, compared raw", async () => {
    expect(idsOf(await invoices.list(ctx, { ...base, search: "mostafa.dz" }))).toContain("inv-one");
  });

  it("does not match a client name for an unrelated invoice search", async () => {
    expect(idsOf(await invoices.list(ctx, { ...base, search: "دراجة" }))).toEqual([]);
  });
});

describe("payments — search across a JOIN", () => {
  it("finds by payment number and by reference", async () => {
    expect(idsOf(await payments.list(ctx, { ...base, search: "PAY-2026" }))).toContain("pay-one");
    expect(idsOf(await payments.list(ctx, { ...base, search: "Virement" }))).toContain("pay-one");
  });

  it("finds by the client's name through the join", async () => {
    expect(idsOf(await payments.list(ctx, { ...base, search: "المصطفي" }))).toContain("pay-one");
  });

  it("finds by the invoice number, compared raw", async () => {
    expect(idsOf(await payments.list(ctx, { ...base, search: "FA-2026-001" }))).toContain("pay-one");
  });
});

describe("admin — tenants are global, not tenant-scoped", () => {
  it("finds a tenant by a name written without the hamza", async () => {
    const result = await admin.listTenants({ tenantId: TENANT, role: "superadmin" }, { ...base, search: "اخري" });
    expect(idsOf(result)).toContain(OTHER);
  });

  it("finds a tenant by subdomain", async () => {
    expect(idsOf(await admin.listTenants({ tenantId: TENANT, role: "superadmin" }, { ...base, search: "smore" }))).toContain(
      TENANT,
    );
  });

  it("refuses a non-superadmin", async () => {
    await expect(
      admin.listTenants({ tenantId: TENANT, role: "user" }, { ...base, search: "x" }),
    ).rejects.toThrow(/administration/i);
  });
});

describe("every migrated table is covered", () => {
  it("has a search_text column and a trigram index on all nine", async () => {
    const tables = [
      "client_notes",
      "support_tickets",
      "archive_documents",
      "users",
      "employees",
      "invoices",
      "payments",
      "tenants",
      "products",
      "clients",
    ];
    for (const table of tables) {
      const columns = await runGlobal(() =>
        getDb().execute(
          sql`select column_name from information_schema.columns where table_name = ${table} and column_name = 'search_text'`,
        ),
      );
      expect({ table, columns: (columns as unknown as { rows: unknown[] }).rows.length }).toEqual({ table, columns: 1 });

      const indexes = await runGlobal(() =>
        getDb().execute(sql`select indexname from pg_indexes where tablename = ${table} and indexname = ${`${table}_search_trgm_idx`}`),
      );
      expect({ table, indexes: (indexes as unknown as { rows: unknown[] }).rows.length }).toEqual({ table, indexes: 1 });
    }
  });
});
