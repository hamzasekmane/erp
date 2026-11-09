import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { closeDb, execSql, initDb } from "./client";

const MIGRATIONS_DIR = join(process.cwd(), "drizzle");

/**
 * Minimal forward-only migrator. Files are applied in lexical order and recorded
 * in `_migrations` (created on first run).
 */
export async function migrate(): Promise<void> {
  await initDb();
  await execSql(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const applied = new Set<string>();
  const rows = (await execSqlRows("SELECT name FROM _migrations")) as Array<{ name: string }>;
  for (const row of rows) applied.add(row.name);

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");
    const statements = sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await execSql(statement);
    }
    await execSql(`INSERT INTO _migrations (name) VALUES ('${file.replace(/'/g, "''")}')`);
    console.log(`applied ${file} (${statements.length} statements)`);
  }
}

async function execSqlRows(sql: string): Promise<unknown[]> {
  const { getDb } = await import("./client");
  const database = getDb();
  // drizzle's execute works for both drivers
  const result = (await database.execute(sql as never)) as unknown;
  if (Array.isArray(result)) return result as unknown[];
  if (result && typeof result === "object" && "rows" in (result as Record<string, unknown>)) {
    return (result as { rows: unknown[] }).rows;
  }
  return [];
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
