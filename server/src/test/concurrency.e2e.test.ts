import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp } from "./app";

/**
 * Concurrency regressions.
 *
 * These tests fire genuinely parallel HTTP requests at the same resource. They
 * fail against the pre-fix implementation, which read the invoice, validated
 * in JavaScript and then wrote an absolute value with no predicate:
 *
 *   update invoices set paid_minor = <observed + amount> where id = ?
 *
 * Under parallel load both requests observe the same `paid_minor`, both pass
 * the overpayment check, and the second write silently discards the first
 * (lost update), letting the invoice be paid beyond its total.
 */
let app: INestApplication;
let http: ReturnType<typeof request>;

const tenant = {
  tenantData: { name: "Concurrency SARL", businessName: "Concurrency SARL", contact: { email: "c@conc.dz" }, currency: "DZD", language: "fr" },
  userData: { name: "Admin Conc", email: "admin@conc.dz", password: "ConcPass123" },
  planCode: "starter",
};

let token = "";
let clientId = "";
let invoiceId = "";

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer());

  const registered = await http.post("/api/auth/register").send(tenant).expect(201);
  token = registered.body.token;

  const client = await http
    .post("/api/clients")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Client Conc", email: "client@conc.dz", code: "CLI-CONC" })
    .expect(201);
  clientId = client.body.data._id;
});

afterAll(async () => {
  await closeTestApp(app);
});

async function createInvoice(total: number): Promise<string> {
  const res = await http
    .post("/api/invoices")
    .set("Authorization", `Bearer ${token}`)
    .send({
      clientId,
      dueDate: "2099-12-31",
      items: [{ description: "Ligne conc", quantity: 1, unitPrice: total, discount: 0, taxRate: 0 }],
    })
    .expect(201);
  return res.body.data._id;
}

function pay(id: string, amount: number) {
  return http
    .post(`/api/invoices/${id}/pay`)
    .set("Authorization", `Bearer ${token}`)
    .send({ amount, method: "CASH" });
}

describe("invoice settlement under concurrency", () => {
  it("does not lose payments when two requests settle the same invoice in parallel", async () => {
    // Total 100.00, two parallel payments of 60.00 each. At most one may win;
    // the invoice must never be paid more than its total.
    invoiceId = await createInvoice(100);

    const [first, second] = await Promise.all([pay(invoiceId, 60), pay(invoiceId, 60)]);
    const statuses = [first.status, second.status].sort();

    // Exactly one success, one rejection.
    expect(statuses).toEqual([200, 422]);

    const invoice = await http.get(`/api/invoices/${invoiceId}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(invoice.body.data.paidAmount).toBe(60);
    expect(invoice.body.data.balance).toBe(40);
    expect(invoice.body.data.status).toBe("partially_paid");
  });

  it("lets a second payment through when it fits the remaining balance", async () => {
    const invoice = await http.get(`/api/invoices/${invoiceId}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(invoice.body.data.balance).toBe(40);

    await pay(invoiceId, 40).expect(200);

    const settled = await http.get(`/api/invoices/${invoiceId}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(settled.body.data.paidAmount).toBe(100);
    expect(settled.body.data.balance).toBe(0);
    expect(settled.body.data.status).toBe("paid");
  });

  it("keeps the invoice balance consistent across many parallel partial payments", async () => {
    // 10 parallel payments of 10.00 against a 100.00 invoice: all should fit,
    // and the sum must be exactly 100 with no lost updates.
    const id = await createInvoice(100);
    const results = await Promise.all(Array.from({ length: 10 }, () => pay(id, 10)));

    const ok = results.filter((res) => res.status === 200).length;
    expect(ok).toBe(10);

    const invoice = await http.get(`/api/invoices/${id}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(invoice.body.data.paidAmount).toBe(100);
    expect(invoice.body.data.balance).toBe(0);
    expect(invoice.body.data.status).toBe("paid");
  });

  it("never accepts a payment that exceeds the remaining balance", async () => {
    const id = await createInvoice(50);
    await pay(id, 30).expect(200);
    const rejected = await pay(id, 30).expect(422);
    expect(rejected.body.error_code).toBe("PAYMENT_EXCEEDS_DUE");

    const invoice = await http.get(`/api/invoices/${id}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(invoice.body.data.paidAmount).toBe(30);
    expect(invoice.body.data.balance).toBe(20);
  });
});

describe("stock updates under concurrency", () => {
  it("does not lose stock movements when two withdrawals race", async () => {
    const product = await http
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "SKU-CONC", name: "Produit Conc", price: 100, cost: 50, stock: 10, minStock: 0 })
      .expect(201);
    const productId = product.body.data._id;

    // Two withdrawals of 4 from a stock of 10: both fit, final stock must be 2.
    const [a, b] = await Promise.all([
      http.post(`/api/products/${productId}/stock`).set("Authorization", `Bearer ${token}`).send({ type: "out", quantity: 4 }),
      http.post(`/api/products/${productId}/stock`).set("Authorization", `Bearer ${token}`).send({ type: "out", quantity: 4 }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 200]);

    const after = await http.get(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(after.body.data.stock).toBe(2);
  });

  it("refuses to drive stock negative when parallel withdrawals exceed the balance", async () => {
    const product = await http
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "SKU-CONC2", name: "Produit Conc 2", price: 100, cost: 50, stock: 5, minStock: 0 })
      .expect(201);
    const productId = product.body.data._id;

    // 5 parallel withdrawals of 2 from stock 5: exactly two may succeed.
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        http.post(`/api/products/${productId}/stock`).set("Authorization", `Bearer ${token}`).send({ type: "out", quantity: 2 }),
      ),
    );
    const ok = results.filter((res) => res.status === 200).length;
    expect(ok).toBe(2);

    const after = await http.get(`/api/products/${productId}`).set("Authorization", `Bearer ${token}`).expect(200);
    expect(after.body.data.stock).toBe(1);
  });
});

describe("stock valuation", () => {
  it("values stock at cost, not at sale price", async () => {
    const product = await http
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({ code: "SKU-VAL", name: "Produit Val", price: 200, cost: 50, stock: 10, minStock: 0 })
      .expect(201);
    expect(product.body.data.stock).toBe(10);

    const stats = await http.get("/api/products/stats").set("Authorization", `Bearer ${token}`).expect(200);
    // 10 units at cost 50.00 = 500.00. Sale price 200.00 would give 2000.00.
    const row = stats.body.data.summary;
    expect(row.totalStockValue).toBeGreaterThanOrEqual(500);
    // The fixture above created other products too; assert this product's
    // contribution is at cost by comparing against the sale-price figure.
    const catalogue = await http.get("/api/products?limit=100").set("Authorization", `Bearer ${token}`).expect(200);
    const saleValue = catalogue.body.data.reduce(
      (sum: number, item: { stock?: number; price?: number }) => sum + Number(item.stock ?? 0) * Number(item.price ?? 0),
      0,
    );
    const costValue = catalogue.body.data.reduce(
      (sum: number, item: { stock?: number; cost?: number }) => sum + Number(item.stock ?? 0) * Number(item.cost ?? 0),
      0,
    );
    // The reported figure must track cost, not sale price.
    expect(Math.abs(row.totalStockValue - costValue)).toBeLessThanOrEqual(Math.abs(row.totalStockValue - saleValue) + 1);
  });
});
