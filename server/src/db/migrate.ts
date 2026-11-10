import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { useEmbeddedDb } from "../config/env";
import { closeDb, getTxClient, initDb, type TxClient } from "./client";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");

/**
 * Forward-only migrator. Each file runs inside a transaction on a single pinned
 * connection, and the file is claimed with `INSERT ... ON CONFLICT DO NOTHING`
 * so two instances booting at once cannot apply the same migration twice.
 * On PostgreSQL a transaction-scoped advisory lock serialises the whole run.
 */
export async function migrate(): Promise<void> {
  await initDb();
  const tx = await getTxClient();
  try {
    await tx.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort();
    if (files.length === 0) return;

    for (const file of files) {
      await applyFile(tx, file);
    }
  } finally {
    await tx.release();
  }
}

async function applyFile(tx: TxClient, file: string) {
  const applied = await tx.query<{ name: string }>(`SELECT name FROM _migrations WHERE name = '${escapeLiteral(file)}'`);
  if (applied.length > 0) return;

  const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  await tx.exec("BEGIN");
  try {
    if (!useEmbeddedDb) {
      // Serialise concurrent deployers for the duration of this transaction.
      await tx.exec("SELECT pg_advisory_xact_lock(hashtext('erp_schema_migrations'))");
    }
    const claimed = await tx.query<{ name: string }>(
      `INSERT INTO _migrations (name) VALUES ('${escapeLiteral(file)}') ON CONFLICT (name) DO NOTHING RETURNING name`,
    );
    if (claimed.length === 0) {
      await tx.exec("ROLLBACK");
      return;
    }
    for (const statement of statements) {
      await tx.exec(statement);
    }
    await tx.exec("COMMIT");
    console.log(`applied ${file} (${statements.length} statements)`);
  } catch (error) {
    await tx.exec("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

if (require.main === module) {
  migrate()
    .then(async () => {
      console.log("migrations complete");
      await closeDb();
    })
    .catch(async (error) => {
      console.error("migration failed", error);
      await closeDb();
      process.exit(1);
    });
}
