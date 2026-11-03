import { adminRoute, q } from "@/lib/api";
import { deleteCatalog, listCatalog, upsertCatalog, type CatalogInput } from "@/lib/admin";
export const GET = adminRoute((req) => listCatalog(q(req).get("kind") || "all"));
export const POST = adminRoute(async (req) => { const b = (await req.json()) as CatalogInput & { id?: string }; return { item: await upsertCatalog(b, b.id) }; });
export const DELETE = adminRoute(async (req) => { await deleteCatalog(q(req).get("id")!); return { ok: true }; });
