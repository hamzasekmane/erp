import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
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
};

let holder: Holder | null = null;

/**
 * Dev/test: embedded PostgreSQL (PGlite, WASM) — same SQL dialect, no server needed.
 * Production: real PostgreSQL through a pooled node-postgres connection.
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

export function getDb(): Database {
  if (!holder) throw new Error("Database not initialised. Call initDb() first.");
  return holder.db;
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
