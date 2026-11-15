import { AsyncLocalStorage } from "node:async_hooks";
import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { eq, sql } from "drizzle-orm";
import { env, useEmbeddedDb } from "../config/env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

export type TxClient = {
  /** Executes one or more statements on a single pinned connection. */
  exec: (sql: string) => Promise<void>;
  /** Runs a query on the same connection and returns the rows. */
  query: <T = Record<string, unknown>>(sql: string) => Promise<T[]>;
  release: () => Promise<void>;
};

type Holder = {
  db: Database;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
  connectTx: () => Promise<TxClient>;
  /** Runs `fn` inside a transaction with RLS context applied. */
  runScoped: <T>(tenantId: string, fn: (tx: Database) => Promise<T>) => Promise<T>;
};

/**
 * Tracks the currently bound tenant-scoped transaction.
 *
 * Drizzle does not thread a transaction handle through a request automatically,
 * so services are written against a single `db` accessor. `getDb()` consults
 * this store first: inside `runTenant()`, it returns the RLS-scoped transaction
 * instead of the pooled handle. That keeps ~20 services unchanged while making
 * every query inside a tenant request run under Row-Level Security.
 */
type TenantScope = { tx: Database; tenantId: string };
const tenantScope = new AsyncLocalStorage<TenantScope>();

let holder: Holder | null = null;

/**
 * Dev/test: embedded PostgreSQL (PGlite, WASM) — same SQL dialect, no server needed.
 * Production: real PostgreSQL through a pooled node-postgres connection.
 *
 * Row-Level Security (see docs/RLS.md and drizzle/0007_rls.sql)
 * ---------------------------------------------------------------------------
 * When `RLS_ENABLED` is true, tenant reads and writes run inside
 * `withTenant(tenantId, fn)`. That helper:
 *   1. opens a transaction,
 *   2. `SET LOCAL app.tenant_id = <tenantId>` on the SAME pinned connection,
 *   3. `SET LOCAL ROLE <RLS_APP_ROLE>` so FORCE policies apply even if the
 *      login role owns the tables,
 *   4. runs the callback.
 * SET LOCAL is transaction-scoped: it is discarded on COMMIT and ROLLBACK, so
 * a pooled connection can never carry one tenant's setting into another
 * tenant's request. A transaction with no setting matches no rows — the system
 * fails closed.
 *
 * `getDb()` is the raw, unscoped handle. It is reserved for work that
 * legitimately has no tenant (authentication lookup by email, public token
 * resolution, outbox workers) and must never be used to serve tenant data.
 */
export async function initDb(): Promise<void> {
  if (holder) return;

  if (useEmbeddedDb) {
    mkdirSync(env.PGLITE_DATA_DIR, { recursive: true });
    const client = new PGlite(env.PGLITE_DATA_DIR);
    await client.waitReady;
    const db = drizzlePglite(client, { schema }) as unknown as Database;
    holder = {
      db,
      exec: async (sql: string) => {
        await client.exec(sql);
      },
      close: async () => {
        await client.close();
      },
      runScoped: async <T,>(tenantId: string, fn: (tx: Database) => Promise<T>): Promise<T> =>
        db.transaction(async (tx) => {
          // Must be inside the transaction: SET LOCAL outside one is discarded.
          await tx.execute(sql`select set_config('app.tenant_id', ${tenantId}, true)`);
          await tx.execute(sql.raw(`set local role ${quoteIdent(env.RLS_APP_ROLE)}`));
          return fn(tx as unknown as Database);
        }),
      connectTx: async () => ({
        exec: async (sql: string) => {
          await client.exec(sql);
        },
        query: async <T>(sql: string) => {
          const result = await client.query<T>(sql);
          return result.rows;
        },
        release: async () => {},
      }),
    };
    return;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
    statement_timeout: 15_000,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (error) => console.error("[db] idle client error", error.message));
  const db = drizzleNodePg(pool, { schema });
  holder = {
    db,
    exec: async (sql: string) => {
      await pool.query(sql);
    },
    close: async () => {
      await pool.end();
    },
    runScoped: async <T,>(tenantId: string, fn: (tx: Database) => Promise<T>): Promise<T> => {
      const client: PoolClient = await pool.connect();
      try {
        await client.query("begin");
        // Parameterised: a tenant id can never alter the statement.
        await client.query("select set_config('app.tenant_id', $1, true)", [tenantId]);
        await client.query(`set local role ${quoteIdent(env.RLS_APP_ROLE)}`);
        // Bind the same connection so every query issued through it is scoped.
        const scoped = drizzleNodePg(client as unknown as Pool, { schema }) as unknown as Database;
        const result = await fn(scoped);
        await client.query("commit");
        return result;
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    connectTx: async () => {
      const client = await pool.connect();
      return {
        exec: async (sql: string) => {
          await client.query(sql);
        },
        query: async <T>(sql: string) => {
          const result = await client.query(sql);
          return result.rows as T[];
        },
        release: async () => {
          client.release();
        },
      };
    },
  };
}

/**
 * Identifier quoting for the role name, which cannot be parameterised.
 * Restricting it to a strict allow-list pattern removes the only injection
 * vector in the RLS path; a misconfigured role name fails loudly at boot.
 */
function quoteIdent(name: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(name)) {
    throw new Error(`Invalid SQL identifier for role: ${name}`);
  }
  return `"${name}"`;
}

/**
 * The database handle for the current context.
 *
 * Inside `runTenant()` this is the RLS-scoped transaction; everywhere else it is
 * the pooled handle. Services call this and stay unaware of scoping.
 */
/**
 * Verifies that the connected role is actually subject to RLS.
 *
 * A deployment that points DATABASE_URL at the table owner (or a superuser)
 * runs with every policy silently inert. That is the single most likely way to
 * believe isolation is on when it is not, so it is checked at boot rather than
 * discovered later.
 *
 * Non-fatal by design: it logs loudly instead of refusing to start, because a
 * superuser connection is legitimate in development and for platform admin.
 */
export async function assertRlsEffective(): Promise<{ enforced: boolean; reason: string }> {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  if (!env.RLS_ENABLED) {
    return { enforced: false, reason: "RLS_ENABLED=false" };
  }
  const rows = extractRows(
    await holder.db.execute(sql`
      select current_user as role,
             (select rolsuper from pg_roles where rolname = current_user) as is_superuser,
             (select rolbypassrls from pg_roles where rolname = current_user) as bypass_rls
    `),
  );
  const row = rows[0];
  const role = String(row?.role ?? "unknown");
  if (row?.is_superuser === true) {
    return { enforced: false, reason: `connected as superuser "${role}"; RLS is inert` };
  }
  if (row?.bypass_rls === true) {
    return { enforced: false, reason: `role "${role}" has BYPASSRLS; RLS is inert` };
  }
  return { enforced: true, reason: `role "${role}" is subject to RLS` };
}

export function getDb(): Database {
  const scope = tenantScope.getStore();
  if (scope) return scope.tx;
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  return holder.db;
}

/**
 * Runs `fn` with the tenant's RLS context applied for the whole callback.
 *
 * Every tenant-facing request handler must wrap its work in this. Outside it,
 * RLS-protected tables return zero rows (fail closed), which surfaces quickly
 * in tests rather than silently leaking.
 */
export async function runTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  if (!tenantId) throw new Error("runTenant requires a tenantId");
  // Already inside a tenant scope: reuse it rather than nesting transactions.
  const existing = tenantScope.getStore();
  if (existing) {
    if (existing.tenantId !== tenantId) {
      throw new Error("Nested tenant scope with a different tenantId is not allowed");
    }
    return fn();
  }
  if (!env.RLS_ENABLED) return fn();
  return holder.runScoped(tenantId, async (tx) => tenantScope.run({ tx, tenantId }, fn));
}

/** The tenant bound to the current scope, or null outside one. */
export function currentTenantId(): string | null {
  return tenantScope.getStore()?.tenantId ?? null;
}

/**
 * Explicitly runs WITHOUT a tenant scope, on the raw handle.
 *
 * Only for work that legitimately has no tenant: authentication lookups by
 * email before a tenant is known, public share-token resolution, background
 * workers, and migrations. Using it to serve tenant data defeats RLS.
 */
export async function runGlobal<T>(fn: () => Promise<T>): Promise<T> {
  return tenantScope.exit(fn);
}

/**
 * Resolves a public share token to its invoice and tenant.
 *
 * Delegates to a SECURITY DEFINER function that bypasses RLS for exactly this
 * lookup and returns only identifiers, never row data. The caller then enters
 * `runTenant(tenantId, ...)` and every subsequent query is scoped normally.
 */
export async function resolvePublicTokenScope(tokenHash: string): Promise<{ invoiceId: string; tenantId: string } | null> {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  const rows = await holder.db.execute(sql`select * from public.resolve_public_token(${tokenHash})`);
  const list = extractRows(rows);
  const first = list[0];
  if (!first) return null;
  return { invoiceId: String(first.invoice_id), tenantId: String(first.tenant_id) };
}

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in (result as Record<string, unknown>)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }
  return [];
}

export async function execSql(sql: string): Promise<void> {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  await holder.exec(sql);
}

/** Pinned connection used by the migrator (transactions need a single session). */
export async function getTxClient(): Promise<TxClient> {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  return holder.connectTx();
}

export async function closeDb(): Promise<void> {
  if (!holder) return;
  await holder.close();
  holder = null;
}

export { schema };
