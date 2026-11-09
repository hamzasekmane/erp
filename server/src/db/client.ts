import { mkdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env, useEmbeddedDb } from "../config/env";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

type Holder = {
  db: Database;
  exec: (sql: string) => Promise<void>;
  close: () => Promise<void>;
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
    };
    return;
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    statement_timeout: 5000,
    idleTimeoutMillis: 30_000,
  });
  const db = drizzleNodePg(pool, { schema });
  holder = {
    db,
    exec: async (sql: string) => {
      await pool.query(sql);
    },
    close: async () => {
      await pool.end();
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

export async function closeDb(): Promise<void> {
  if (!holder) return;
  await holder.close();
  holder = null;
}

export { schema };
