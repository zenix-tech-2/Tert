import { adminRoute, q } from "@/lib/api";
import { confirmPayment, listPayments } from "@/lib/admin";
export const GET = adminRoute((req) => listPayments(q(req).get("status") || "all", Number(q(req).get("page") || 1)));
export const POST = adminRoute(async (req, admin) => { const b = (await req.json()) as { id: string }; await confirmPayment(b.id, admin.id); return { ok: true }; });
