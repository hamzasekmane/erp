import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp } from "./app";

/**
 * Public invoice access.
 *
 * The pre-fix implementation exposed `GET /api/invoices/:id/view` and
 * `GET /api/invoices/:id/export/pdf/public` with no authentication and no
 * authorisation: possession of a (non-revocable, non-expiring) invoice UUID was
 * the only control. Those routes are replaced by a hashed, expiring, revocable
 * token.
 *
 * These tests fail against the old routes and pass against the token routes.
 */
let app: INestApplication;
let http: ReturnType<typeof request>;

const tenantA = {
  tenantData: { name: "Pub Alpha", businessName: "Pub Alpha", contact: { email: "contact@pubalpha.dz" }, currency: "DZD", language: "fr" },
  userData: { name: "Admin Pub A", email: "admin@pubalpha.dz", password: "PubAlpha123" },
  planCode: "starter",
};
const tenantB = {
  tenantData: { name: "Pub Beta", businessName: "Pub Beta", contact: { email: "contact@pubbeta.dz" }, currency: "DZD", language: "fr" },
  userData: { name: "Admin Pub B", email: "admin@pubbeta.dz", password: "PubBeta123" },
  planCode: "starter",
};

let tokenA = "";
let tokenB = "";
let clientA = "";
let invoiceA = "";
let draftA = "";

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer());

  const a = await http.post("/api/auth/register").send(tenantA).expect(201);
  tokenA = a.body.token;
  const b = await http.post("/api/auth/register").send(tenantB).expect(201);
  tokenB = b.body.token;

  const client = await http
    .post("/api/clients")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ name: "Client Public", email: "client@public.dz", code: "CLI-PUB" })
    .expect(201);
  clientA = client.body.data._id;

  const invoice = await http
    .post("/api/invoices")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({
      clientId: clientA,
      dueDate: "2099-12-31",
      items: [{ description: "Prestation", quantity: 1, unitPrice: 1000, discount: 0, taxRate: 0 }],
    })
    .expect(201);
  invoiceA = invoice.body.data._id;

  const draft = await http
    .post("/api/invoices")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({
      clientId: clientA,
      dueDate: "2099-12-31",
      status: "draft",
      items: [{ description: "Brouillon", quantity: 1, unitPrice: 500, discount: 0, taxRate: 0 }],
    })
    .expect(201);
  draftA = draft.body.data._id;
});

afterAll(async () => {
  await closeTestApp(app);
});

function createLink(invoiceId: string, token = tokenA, body: Record<string, unknown> = {}) {
  return http
    .post(`/api/invoices/${invoiceId}/public-link`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("public invoice access — token issuance", () => {
  it("requires authentication to mint a public link", async () => {
    await http.post(`/api/invoices/${invoiceA}/public-link`).send({}).expect(401);
  });

  it("mints a token with an expiry and a shareable url", async () => {
    const res = await createLink(invoiceA).expect(201);
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.token.length).toBeGreaterThanOrEqual(32);
    expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(res.body.data.url).toContain(res.body.data.token);
  });

  it("never returns the token from any read endpoint", async () => {
    const created = await createLink(invoiceA).expect(201);
    const invoice = await http.get(`/api/invoices/${invoiceA}`).set("Authorization", `Bearer ${tokenA}`).expect(200);
    expect(JSON.stringify(invoice.body)).not.toContain(created.body.data.token);
  });

  it("refuses to mint a link for a draft invoice", async () => {
    const res = await createLink(draftA).expect(422);
    expect(res.body.error_code).toBe("INVOICE_NOT_PUBLISHED");
  });

  it("refuses to mint a link for another tenant's invoice", async () => {
    // tenant B must not be able to create a public link on tenant A's invoice
    await createLink(invoiceA, tokenB).expect(404);
  });
});

describe("public invoice access — viewing", () => {
  it("serves the invoice to an anonymous holder of the token", async () => {
    const created = await createLink(invoiceA).expect(201);
    const res = await http.get(`/api/invoices/public/${created.body.data.token}`).expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invoice.id).toBe(invoiceA);
    expect(res.body.data.invoice.total).toBe(1000);
    // The customer's own document, and the issuer's fiscal identity.
    expect(res.body.data.invoice.clientId.name).toBe("Client Public");
    expect(res.body.data.company).toBeTruthy();
  });

  it("serves the PDF to an anonymous holder of the token", async () => {
    const created = await createLink(invoiceA).expect(201);
    const res = await http.get(`/api/invoices/public/${created.body.data.token}/pdf`).expect(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
  });

  it("rejects an unknown token without leaking whether the invoice exists", async () => {
    const bogus = "x".repeat(43);
    const res = await http.get(`/api/invoices/public/${bogus}`).expect(404);
    expect(res.body.error_code).toBe("NOT_FOUND");
  });

  it("does not accept a raw invoice id as a token", async () => {
    await http.get(`/api/invoices/public/${invoiceA}`).expect(404);
  });
});

describe("public invoice access — the old id-based routes are gone", () => {
  it("no longer exposes GET /invoices/:id/view anonymously", async () => {
    const res = await http.get(`/api/invoices/${invoiceA}/view`);
    expect(res.status).not.toBe(200);
  });

  it("no longer exposes an anonymous PDF by id", async () => {
    const res = await http.get(`/api/invoices/${invoiceA}/export/pdf/public`);
    expect(res.status).not.toBe(200);
  });
});

describe("public invoice access — revocation and expiry", () => {
  it("revokes every active link for an invoice", async () => {
    const first = await createLink(invoiceA).expect(201);
    const second = await createLink(invoiceA).expect(201);

    await http.get(`/api/invoices/public/${first.body.data.token}`).expect(200);

    await http.delete(`/api/invoices/${invoiceA}/public-link`).set("Authorization", `Bearer ${tokenA}`).expect(200);

    await http.get(`/api/invoices/public/${first.body.data.token}`).expect(404);
    await http.get(`/api/invoices/public/${second.body.data.token}`).expect(404);
  });

  it("refuses to revoke another tenant's links", async () => {
    const created = await createLink(invoiceA).expect(201);
    await http.delete(`/api/invoices/${invoiceA}/public-link`).set("Authorization", `Bearer ${tokenB}`).expect(404);
    // Still valid for tenant A's link.
    await http.get(`/api/invoices/public/${created.body.data.token}`).expect(200);
  });

  it("rejects an expired token", async () => {
    const created = await createLink(invoiceA).expect(201);
    await http.get(`/api/invoices/public/${created.body.data.token}`).expect(200);

    // Move the expiry into the past.
    const { getDb } = await import("../db/client");
    const { invoicePublicTokens } = await import("../db/schema");
    const { hashToken } = await import("../shared/security/tokens");
    const { eq } = await import("drizzle-orm");
    await getDb()
      .update(invoicePublicTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(invoicePublicTokens.tokenHash, hashToken(created.body.data.token)));

    await http.get(`/api/invoices/public/${created.body.data.token}`).expect(404);
  });

  it("stores only a hash of the token, never the token itself", async () => {
    const created = await createLink(invoiceA).expect(201);
    const { getDb } = await import("../db/client");
    const { invoicePublicTokens } = await import("../db/schema");
    const rows = await getDb().select().from(invoicePublicTokens);
    expect(JSON.stringify(rows)).not.toContain(created.body.data.token);
  });

  it("invalidates links when the invoice is deleted", async () => {
    const invoice = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        clientId: clientA,
        dueDate: "2099-12-31",
        items: [{ description: "À supprimer", quantity: 1, unitPrice: 10, discount: 0, taxRate: 0 }],
      })
      .expect(201);
    const created = await createLink(invoice.body.data._id).expect(201);
    await http.get(`/api/invoices/public/${created.body.data.token}`).expect(200);

    await http.delete(`/api/invoices/${invoice.body.data._id}`).set("Authorization", `Bearer ${tokenA}`).expect(200);
    await http.get(`/api/invoices/public/${created.body.data.token}`).expect(404);
  });
});

describe("public invoice access — tenant isolation", () => {
  it("a token only ever exposes its own invoice", async () => {
    const createdA = await createLink(invoiceA).expect(201);

    const clientB = await http
      .post("/api/clients")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Client Beta", email: "client@beta.dz", code: "CLI-BETA" })
      .expect(201);
    const invoiceB = await http
      .post("/api/invoices")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({
        clientId: clientB.body.data._id,
        dueDate: "2099-12-31",
        items: [{ description: "Beta", quantity: 1, unitPrice: 777, discount: 0, taxRate: 0 }],
      })
      .expect(201);
    const createdB = await createLink(invoiceB.body.data._id, tokenB).expect(201);

    const viewA = await http.get(`/api/invoices/public/${createdA.body.data.token}`).expect(200);
    const viewB = await http.get(`/api/invoices/public/${createdB.body.data.token}`).expect(200);

    expect(viewA.body.data.invoice.id).toBe(invoiceA);
    expect(viewB.body.data.invoice.id).toBe(invoiceB.body.data._id);
    expect(viewA.body.data.invoice.id).not.toBe(viewB.body.data.invoice.id);
    expect(viewA.body.data.company.name).toBe("Pub Alpha");
    expect(viewB.body.data.company.name).toBe("Pub Beta");
  });
});
