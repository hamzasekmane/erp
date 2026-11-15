import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeTestApp, createTestApp } from "./app";

/**
 * Readiness contract: a container orchestrator decides whether to send traffic
 * based on the HTTP STATUS, not the JSON body. The pre-fix implementation
 * always answered 200 with `{ success: false }` when the database was down,
 * so a broken pod kept receiving traffic.
 */
let app: INestApplication;
let http: ReturnType<typeof request>;

beforeAll(async () => {
  app = await createTestApp();
  http = request(app.getHttpServer());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("health endpoints", () => {
  it("liveness answers 200 and never touches the database", async () => {
    const res = await http.get("/api/health/live").expect(200);
    expect(res.body.data.status).toBe("ok");
  });

  it("readiness answers 200 when dependencies are healthy", async () => {
    const res = await http.get("/api/health/ready").expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.checks.database).toBe("ok");
  });

  it("readiness answers 503 when the database is unreachable", async () => {
    const { getDb } = await import("../db/client");
    const db = getDb();
    const original = db.execute.bind(db);
    // Simulate an outage: the readiness probe must fail closed.
    (db as unknown as { execute: unknown }).execute = async () => {
      throw new Error("connection terminated");
    };
    try {
      const res = await http.get("/api/health/ready");
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe("not_ready");
      expect(res.body.data.checks.database).toBe("down");
    } finally {
      (db as unknown as { execute: unknown }).execute = original;
    }
  });

  it("recovers to 200 once the database is reachable again", async () => {
    await http.get("/api/health/ready").expect(200);
  });

  it("the root health endpoint reports degraded status alongside a 503", async () => {
    const { getDb } = await import("../db/client");
    const db = getDb();
    const original = db.execute.bind(db);
    (db as unknown as { execute: unknown }).execute = async () => {
      throw new Error("down");
    };
    try {
      const res = await http.get("/api/health");
      expect(res.status).toBe(503);
    } finally {
      (db as unknown as { execute: unknown }).execute = original;
    }
  });
});
