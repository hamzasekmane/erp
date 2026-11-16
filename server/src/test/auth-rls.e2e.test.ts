import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closeTestApp, createTestApp } from "./app";
import { resetRegistrations } from "./db-cleanup";
import { getDb, runTenant } from "../db/client";
import { outboxEvents } from "../db/schema";

/**
 * Authentication with RLS genuinely engaged.
 *
 * Every endpoint below runs BEFORE a tenant is known, and every table it needs
 * (`users`, `sessions`, `password_reset_tokens`, `tenant_settings`, `tenants`)
 * has FORCE RLS. The suite therefore covers the one thing that decides whether
 * the product can be used in production at all: can a user sign in when the
 * application role cannot see the `users` table?
 *
 * The first test is the control. It asserts that an unscoped read as the
 * application role really does return nothing — so the logins that follow cannot
 * be passing because RLS is inert.
 */

let app: INestApplication;
let http: ReturnType<typeof request>;

const tenantA = {
  tenantData: {
    name: "Scope Alpha SARL",
    businessName: "Scope Alpha SARL",
    contact: { email: "contact@scope-alpha.dz" },
    currency: "DZD",
    language: "fr",
  },
  userData: { name: "Admin Scope", email: "admin@scope-alpha.dz", password: "ScopePass123" },
  planCode: "starter",
};

beforeAll(async () => {
  app = await createTestApp();
  await resetRegistrations([tenantA.userData.email]);
  http = request(app.getHttpServer());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("auth with RLS enforced", () => {
  it("cannot read users without a tenant, yet login still resolves the account", async () => {
    await http.post("/api/auth/register").send(tenantA).expect(201);

    // Control: as the application role, with no tenant set, the table is empty.
    // If this ever returns a row, every assertion below is meaningless.
    const unscoped = await getDb().transaction(async (tx) => {
      await tx.execute(sql`set local role erp_app`);
      const result = await tx.execute(sql`select count(*)::int as n from users`);
      const rows = (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [])) as Array<{ n: number }>;
      return Number(rows[0]?.n ?? -1);
    });
    expect(unscoped).toBe(0);

    const login = await http.post("/api/auth/login").send(tenantA.userData).expect(200);
    expect(login.body.token).toBeTruthy();
    expect(login.body.user.email).toBe(tenantA.userData.email);
    expect(login.body.tenant.name).toBe(tenantA.tenantData.name);
    // tenant_settings was read inside the scope: a missing row would leave the
    // serialized tenant without its defaults.
    expect(login.body.tenant).toBeTruthy();
  });

  it("rejects an unknown email without disclosing that it is unknown", async () => {
    const res = await http
      .post("/api/auth/login")
      .send({ email: "nobody@scope-alpha.dz", password: "Whatever123" })
      .expect(401);
    expect(res.body.error_code).toBe("UNAUTHORIZED");
  });

  it("rotates a refresh token through the pre-tenant session lookup", async () => {
    const login = await http.post("/api/auth/login").send(tenantA.userData).expect(200);
    const refreshed = await http.post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken }).expect(200);
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
    expect(refreshed.body.user.email).toBe(tenantA.userData.email);

    // Reuse of the rotated token must revoke the family.
    await http.post("/api/auth/refresh").send({ refreshToken: login.body.refreshToken }).expect(401);
  });

  it("completes a password reset end to end", async () => {
    await http
      .post("/api/auth/forgot-password")
      .send({ email: tenantA.userData.email })
      .expect(200);

    // The token is delivered by the outbox; read it back the same way any
    // tenant-scoped worker would (the queue row is itself RLS-protected).
    const scope = await getDb().transaction(async (tx) => {
      await tx.execute(sql`set local role erp_app`);
      const result = await tx.execute(sql`select * from public.resolve_login_scope(${tenantA.userData.email})`);
      const rows = (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [])) as Array<{
        tenant_id: string;
      }>;
      return rows[0]?.tenant_id ?? null;
    });
    expect(scope).toBeTruthy();

    const token = await runTenant(scope!, async () => {
      const [event] = await getDb()
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.type, "password.reset"))
        .limit(1);
      return (event?.payload as { token?: string } | null)?.token ?? null;
    });
    expect(typeof token).toBe("string");

    const newPassword = "ScopePass456";
    await http.post("/api/auth/reset-password").send({ token, password: newPassword }).expect(200);
    await http
      .post("/api/auth/login")
      .send({ email: tenantA.userData.email, password: newPassword })
      .expect(200);
    // The old password no longer works.
    await http
      .post("/api/auth/login")
      .send({ email: tenantA.userData.email, password: tenantA.userData.password })
      .expect(401);
  });
});
