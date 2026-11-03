import { adminRoute, q } from "@/lib/api";
import { deleteContact, importContacts, listContactsAdmin } from "@/lib/admin";
export const GET = adminRoute((req) => listContactsAdmin(q(req).get("q") || "", Number(q(req).get("page") || 1)));
export const POST = adminRoute(async (req) => { const b = (await req.json()) as { rows: Parameters<typeof importContacts>[0] }; return { inserted: await importContacts(b.rows || []) }; });
export const DELETE = adminRoute(async (req) => { await deleteContact(q(req).get("id")!); return { ok: true }; });
