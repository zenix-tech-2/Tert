import { adminRoute, q } from "@/lib/api";
import { decideWithdrawal, listWithdrawals } from "@/lib/admin";
export const GET = adminRoute((req) => listWithdrawals(q(req).get("status") || "pending", Number(q(req).get("page") || 1)));
export const POST = adminRoute(async (req, admin) => {
  const b = (await req.json()) as { id: string; decision: "approved" | "completed" | "rejected"; note?: string };
  await decideWithdrawal(b.id, b.decision, b.note || "", admin.id);
  return { ok: true };
});
