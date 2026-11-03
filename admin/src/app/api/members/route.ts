import { adminRoute, q } from "@/lib/api";
import { activateMember, adjustBalance, getMember, listMembers, resetPassword, setRole } from "@/lib/admin";
import { hashPassword } from "@/lib/auth";

export const GET = adminRoute(async (req) => {
  const p = q(req);
  if (p.get("id")) return getMember(p.get("id")!);
  return listMembers(p.get("q") || "", p.get("status") || "all", Number(p.get("page") || 1));
});
export const POST = adminRoute(async (req, admin) => {
  const b = (await req.json()) as { action: string; id: string; field?: "balance" | "gains" | "balanceUsd" | "feuilles"; delta?: number; note?: string; role?: "member" | "admin"; password?: string };
  if (b.action === "activate") await activateMember(b.id, admin.id);
  else if (b.action === "adjust") await adjustBalance(b.id, b.field!, Number(b.delta), b.note || "", admin.id);
  else if (b.action === "role") await setRole(b.id, b.role!);
  else if (b.action === "password") await resetPassword(b.id, await hashPassword(String(b.password)));
  return { ok: true };
});
