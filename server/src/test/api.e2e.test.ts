import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp } from "./app";

let app: INestApplication;
let http: ReturnType<typeof request>;

const tenantA = {
  tenantData: { name: "Alpha SARL", businessName: "Alpha SARL", contact: { email: "contact@alpha.dz" }, currency: "DZD", language: "fr" },
  userData: { name: "Admin Alpha", email: "admin@alpha.dz", password: "AlphaPass123" },
  planCode: "starter",
};

const tenantB = {
  tenantData: { name: "Beta SARL", businessName: "Beta SARL", contact: { email: "contact@beta.dz" }, currency: "DZD", language: "fr" },
  userData: { name: "Admin Beta", email: "admin@beta.dz", password: "BetaPass123" },
  planCode: "starter",
};

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("health", () => {
  it("reports database status without authentication", async () => {
    const res = await http.get("/api/health").expect(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("serves the versioned alias", async () => {
    const res = await http.get("/api/v1/health").expect(200);
    expect(res.body.success).toBe(true);
  });
});

describe("auth", () => {
  it("registers a tenant and returns a top-level token", async () => {
    const res = await http.post("/api/auth/register").send(tenantA).expect(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.user.role).toBe("tenant_admin");
    expect(res.body.tenant.currency).toBe("DZD");
  });

  it("rejects duplicate emails", async () => {
    const res = await http.post("/api/auth/register").send(tenantA).expect(409);
    expect(res.body.error_code).toBe("EMAIL_IN_USE");
  });

  it("rejects a bad password without leaking user existence", async () => {
    const res = await http.post("/api/auth/login").send({ email: tenantA.userData.email, password: "wrong-password" }).expect(401);
    expect(res.body.error_code).toBe("UNAUTHORIZED");
  });

  it("logs in and exposes the permissions", async () => {
    const res = await http.post("/api/auth/login").send({ email: tenantA.userData.email, password: tenantA.userData.password }).expect(200);
    expect(res.body.permissions).toContain("invoices:write");
    const me = await http.get("/api/auth/me").set("Authorization", `Bearer ${res.body.token}`).expect(200);
    expect(me.body.data.user.email).toBe(tenantA.userData.email);
  });

  it("rotates refresh tokens and detects reuse", async () => {
    const login = await http.post("/api/auth/login").send({ email: tenantA.userData.email, password: tenantA.userData.password }).expect(200);
    const refreshed = await http.post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken }).expect(200);
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
    await http.post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken }).expect(401);
  });

  it("requires a bearer token on protected routes", async () => {
    const res = await http.get("/api/clients").expect(401);
    expect(res.body.error_code).toBe("UNAUTHORIZED");
  });
});

describe("clients, invoices and payments", () => {
  let tokenA = "";
  let tokenB = "";
  let clientA = "";
  let productA = "";
  let invoiceA = "";

  beforeAll(async () => {
    const a = await http.post("/api/auth/login").send({ email: tenantA.userData.email, password: tenantA.userData.password });
    tokenA = a.body.token;
    const b = await http.post("/api/auth/register").send(tenantB).expect(201);
    tokenB = b.body.token;
  });

  it("creates a client scoped to the tenant", async () => {
    const res = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ code: "CLI-001", name: "Client Alpha", type: "company", category: "vip", email: "client@alpha.dz", creditLimit: 10000 })
      .expect(201);
    clientA = res.body.data._id;
    expect(res.body.data.balance).toBe(0);
    expect(res.body.data.creditLimit).toBe(10000);
  });

  it("prevents duplicate client codes", async () => {
    const res = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ code: "CLI-001", name: "Doublon" })
      .expect(409);
    expect(res.body.error_code).toBe("CLIENT_CODE_EXISTS");
  });

  it("does not leak clients across tenants", async () => {
    await http.get(`/api/clients/${clientA}`).set("Authorization", `Bearer ${tokenB}`).expect(404);
    const list = await http.get("/api/clients").set("Authorization", `Bearer ${tokenB}`).expect(200);
    expect(list.body.data).toHaveLength(0);
  });

  it("creates a product with initial stock", async () => {
    const res = await http
      .post("/api/products")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ code: "P-001", name: "Produit Alpha", price: 100, cost: 40, stock: 50, minStock: 5, unit: "piece" })
      .expect(201);
    productA = res.body.data._id;
    expect(res.body.data.stock).toBe(50);
  });

  it("issues an invoice and computes totals in minor units", async () => {
    const res = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        clientId: clientA,
        dueDate: "2099-12-31",
        items: [{ productId: productA, description: "Produit Alpha", quantity: 2, unitPrice: 100, discount: 10, taxRate: 19 }],
        discount: 5,
        shipping: 20,
      })
      .expect(201);
    invoiceA = res.body.data._id;
    expect(res.body.data.subtotal).toBe(180);
    expect(res.body.data.taxAmount).toBe(34.2);
    expect(res.body.data.total).toBe(229.2);
    expect(res.body.data.status).toBe("sent");
    expect(res.body.data.invoiceNumber).toMatch(/^FA-\d{4}-\d{4}$/);
  });

  it("registers a partial payment and updates the balance", async () => {
    const res = await http
      .post(`/api/invoices/${invoiceA}/pay`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ amount: 100, method: "CASH" })
      .expect(200);
    expect(res.body.data.amount).toBe(100);

    const invoice = await http.get(`/api/invoices/${invoiceA}`).set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(invoice.body.data.paidAmount).toBe(100);
    expect(invoice.body.data.balance).toBeCloseTo(129.2, 2);
    expect(invoice.body.data.status).toBe("partially_paid");
  });

  it("rejects overpayment", async () => {
    const res = await http
      .post(`/api/invoices/${invoiceA}/pay`)
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ amount: 5000, method: "CASH" })
      .expect(422);
    expect(res.body.error_code).toBe("PAYMENT_EXCEEDS_DUE");
  });

  it("refunds a payment and reopens the invoice", async () => {
    const payment = await http.get("/api/payments").set("Authorization", `Bearer ${tokenA}`).expect(200);
    const paymentId = payment.body.data[0]._id;
    await http.post(`/api/payments/${paymentId}/refund`).set("Authorization", `Bearer ${tokenA}`).send({ amount: 40, reason: "Erreur de caisse" }).expect(200);
    const invoice = await http.get(`/api/invoices/${invoiceA}`).set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(invoice.body.data.paidAmount).toBe(60);
  });

  it("serves invoice stats and dashboard aggregates", async () => {
    const stats = await http.get("/api/invoices/stats").set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(stats.body.data.summary.count).toBe(1);
    const dashboard = await http.get("/api/dashboard/stats").set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(dashboard.body.data.stats.clients.total).toBe(1);
  });

  it("enforces RBAC on user management", async () => {
    const created = await http
      .post("/api/users")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Employé", email: "employe@alpha.dz", password: "Employe123", role: "user" })
      .expect(201);
    const login = await http.post("/api/auth/login").send({ email: "employe@alpha.dz", password: "Employe123" }).expect(200);
    expect(login.body.permissions).not.toContain("users:write");
    await http.get("/api/users").set("Authorization", `Bearer ${login.body.token}`).expect(403);
    expect(created.body.data.role).toBe("user");
  });

  it("validates payloads with field-level errors", async () => {
    const res = await http.post("/api/clients").set("Authorization", `Bearer ${tokenA}`).send({ name: "" }).expect(400);
    expect(res.body.error_code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
