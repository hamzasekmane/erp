import { eq, sql } from "drizzle-orm";
import { closeDb, getDb, initDb } from "./client";
import { ensureBaselinePlans } from "./bootstrap";
import { migrate } from "./migrate";
import {
  categories,
  clientNotes,
  clients,
  invoiceItems,
  invoices,
  payments,
  plans,
  products,
  stockLevels,
  stockMovements,
  subscriptions,
  taxes,
  tenantSettings,
  tenants,
  users,
} from "./schema";
import { hashPassword } from "../shared/security/password";
import { newId } from "../shared/ids";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@erp.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
const DEMO_EMAIL = process.env.SEED_DEMO_EMAIL ?? "demo@erp.local";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo1234!";

async function seedPlatform() {
  const db = getDb();
  const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, "platform")).limit(1);
  if (existing) return existing.id;

  const tenantId = newId();
  await db.insert(tenants).values({
    id: tenantId,
    name: "Plateforme ERP",
    subdomain: "platform",
    email: ADMIN_EMAIL,
    country: "DZ",
    status: "active",
    planCode: "enterprise",
  });
  await db.insert(tenantSettings).values({ tenantId });
  await db.insert(users).values({
    id: newId(),
    tenantId,
    email: ADMIN_EMAIL,
    name: "Super Admin",
    passwordHash: hashPassword(ADMIN_PASSWORD),
    role: "superadmin",
    status: "active",
  });
  return tenantId;
}

async function seedDemo(demoPlanCode: string) {
  const db = getDb();
  const [existing] = await db.select().from(tenants).where(eq(tenants.subdomain, "demo")).limit(1);
  if (existing) return existing.id;

  const tenantId = newId();
  const now = new Date();
  const [plan] = await db.select().from(plans).where(eq(plans.code, demoPlanCode)).limit(1);

  await db.insert(tenants).values({
    id: tenantId,
    name: "Boulangerie El Baraka",
    subdomain: "demo",
    email: DEMO_EMAIL,
    phone: "029 71 22 33",
    address: "12 rue des Palmiers",
    city: "Ouargla",
    country: "DZ",
    taxNumber: "NIF-0987654321",
    currency: "DZD",
    status: "active",
    planCode: demoPlanCode,
  });
  await db.insert(tenantSettings).values({ tenantId, invoicePrefix: "FA-" });
  await db.insert(users).values({
    id: newId(),
    tenantId,
    email: DEMO_EMAIL,
    name: "Yacine Demo",
    passwordHash: hashPassword(DEMO_PASSWORD),
    role: "tenant_admin",
    status: "active",
  });
  if (plan) {
    await db.insert(subscriptions).values({
      id: newId(),
      tenantId,
      planId: plan.id,
      status: "active",
      billingCycle: "monthly",
      startDate: now,
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      priceMinor: plan.priceMonthlyMinor,
      currency: "DZD",
    });
  }

  const vatId = newId();
  await db.insert(taxes).values({ id: vatId, tenantId, name: "TVA 19%", rateBp: 1900 });
  const catBread = newId();
  const catPastry = newId();
  await db.insert(categories).values([
    { id: catBread, tenantId, name: "Pains", type: "product", color: "#f59e0b", icon: "wheat" },
    { id: catPastry, tenantId, name: "Pâtisseries", type: "product", color: "#ec4899", icon: "cake" },
  ]);

  const productRows = [
    { code: "P-001", name: "Pain traditionnel", categoryId: catBread, price: 25, cost: 10, stock: 120, minStock: 20 },
    { code: "P-002", name: "Baguette", categoryId: catBread, price: 15, cost: 6, stock: 200, minStock: 30 },
    { code: "P-003", name: "Croissant pur beurre", categoryId: catPastry, price: 60, cost: 25, stock: 60, minStock: 12 },
    { code: "P-004", name: "Mille-feuille", categoryId: catPastry, price: 120, cost: 45, stock: 8, minStock: 10 },
  ];

  const productIds: string[] = [];
  for (const row of productRows) {
    const id = newId();
    productIds.push(id);
    await db.insert(products).values({
      id,
      tenantId,
      code: row.code,
      name: row.name,
      categoryId: row.categoryId,
      priceMinor: Math.round(row.price * 100),
      costMinor: Math.round(row.cost * 100),
      minStock: String(row.minStock),
      unit: "piece",
      taxId: vatId,
    });
    await db.insert(stockLevels).values({ productId: id, tenantId, quantity: String(row.stock) });
    await db.insert(stockMovements).values({ id: newId(), tenantId, productId: id, type: "in", quantity: String(row.stock), unitCostMinor: Math.round(row.cost * 100), reason: "Stock initial" });
  }

  const clientRows = [
    { code: "CLI-001", name: "Épicerie Amine", type: "company", category: "wholesale", email: "amine@example.dz", phone: "0550112233", balance: 0, creditLimit: 200000 },
    { code: "CLI-002", name: "Hôtel Sahara", type: "company", category: "vip", email: "achats@sahara.dz", phone: "029123456", balance: 0, creditLimit: 500000 },
    { code: "CLI-003", name: "Famille Benali", type: "individual", category: "regular", email: "benali@example.dz", phone: "0661445566", balance: 0, creditLimit: 20000 },
  ];
  const clientIds: string[] = [];
  for (const row of clientRows) {
    const id = newId();
    clientIds.push(id);
    await db.insert(clients).values({
      id,
      tenantId,
      code: row.code,
      name: row.name,
      type: row.type,
      category: row.category,
      email: row.email,
      phone: row.phone,
      creditLimitMinor: row.creditLimit,
      address: { city: "Ouargla", country: "Algérie" },
    });
  }

  await db.insert(clientNotes).values({
    id: newId(),
    tenantId,
    clientId: clientIds[1]!,
    title: "Commande hebdomadaire",
    content: "Livraison chaque dimanche matin, 40 baguettes et 20 croissants.",
    category: "follow-up",
  });

  // Issued invoices: one paid, one partially paid, one overdue.
  const invoiceSeed = [
    { client: clientIds[0]!, daysAgo: 20, dueIn: -5, status: "paid", paidRatio: 1 },
    { client: clientIds[1]!, daysAgo: 8, dueIn: 15, status: "partially_paid", paidRatio: 0.4 },
    { client: clientIds[2]!, daysAgo: 40, dueIn: -20, status: "overdue", paidRatio: 0 },
  ];

  let sequence = 1;
  for (const seed of invoiceSeed) {
    const invoiceId = newId();
    const issue = new Date(now.getTime() - seed.daysAgo * 24 * 60 * 60 * 1000);
    const due = new Date(issue.getTime() + (seed.daysAgo + seed.dueIn) * 24 * 60 * 60 * 1000);
    const issueDate = issue.toISOString().slice(0, 10);
    const dueDate = (due < issue ? new Date(issue.getTime() + 5 * 24 * 60 * 60 * 1000) : due).toISOString().slice(0, 10);

    const lines = [
      { productId: productIds[0]!, description: "Pain traditionnel", quantity: 20, unitPriceMinor: 2500, taxRateBp: 1900 },
      { productId: productIds[2]!, description: "Croissant pur beurre", quantity: 10, unitPriceMinor: 6000, taxRateBp: 1900 },
    ];
    let subtotal = 0;
    let tax = 0;
    for (const line of lines) {
      const base = line.quantity * line.unitPriceMinor;
      subtotal += base;
      tax += Math.round((base * line.taxRateBp) / 10_000);
    }
    const total = subtotal + tax;
    const paid = Math.round(total * seed.paidRatio);

    await db.insert(invoices).values({
      id: invoiceId,
      tenantId,
      number: `FA-${issue.getFullYear()}-${String(sequence).padStart(4, "0")}`,
      clientId: seed.client,
      status: seed.status,
      issueDate,
      dueDate,
      subtotalMinor: subtotal,
      taxMinor: tax,
      totalMinor: total,
      paidMinor: paid,
      dueMinor: total - paid,
      notes: "Merci de votre confiance.",
    });
    for (const [index, line] of lines.entries()) {
      await db.insert(invoiceItems).values({
        id: newId(),
        invoiceId,
        position: index + 1,
        productId: line.productId,
        description: line.description,
        quantity: String(line.quantity),
        unitPriceMinor: line.unitPriceMinor,
        taxRateBp: line.taxRateBp,
        taxMinor: Math.round((line.quantity * line.unitPriceMinor * line.taxRateBp) / 10_000),
        lineTotalMinor: line.quantity * line.unitPriceMinor,
      });
    }
    if (paid > 0) {
      const paymentId = newId();
      await db.insert(payments).values({
        id: paymentId,
        tenantId,
        number: `PAY-${issue.getFullYear()}-${String(sequence).padStart(4, "0")}`,
        clientId: seed.client,
        invoiceId,
        amountMinor: paid,
        method: sequence % 2 === 0 ? "BANK_TRANSFER" : "CASH",
        status: "completed",
        paidAt: new Date(issue.getTime() + 2 * 24 * 60 * 60 * 1000),
      });
    }
    sequence += 1;
  }

  await db.execute(sql`insert into number_sequences (tenant_id, doc_type, period, next_value) values (${tenantId}, 'invoice', ${String(now.getFullYear())}, ${sequence}) on conflict do nothing`);
  return tenantId;
}

async function main() {
  await initDb();
  await migrate();
  await ensureBaselinePlans();
  await seedPlatform();
  await seedDemo(process.env.SEED_DEMO_PLAN ?? "professional");
  console.log("seed complete");
  console.log(`platform admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`demo tenant:    ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  await closeDb();
}

main().catch(async (error) => {
  console.error("seed failed", error);
  await closeDb();
  process.exit(1);
});
