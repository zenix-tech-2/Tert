// Copies the shared Drizzle schema from the member app so both apps always use the same tables.
// When deploying only the admin folder (e.g. Vercel root = admin), the committed copy is used.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../src/db/schema.ts");
const dst = resolve(here, "../src/db/schema.ts");
if (existsSync(src)) { mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); console.log("schema synced from member app"); }
else console.log("member app schema not found, using committed copy");
