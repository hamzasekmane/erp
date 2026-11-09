import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { buildOpenApiDocument } from "./document";

async function main() {
  const document = buildOpenApiDocument();
  const target = join(process.cwd(), "..", "docs", "openapi.json");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`OpenAPI written to ${target} (${Object.keys(document.paths ?? {}).length} paths)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
