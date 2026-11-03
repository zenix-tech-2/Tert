import { adminRoute, q } from "@/lib/api";
import { decideCampaign, listCampaigns, listSubmittedDays, verifyDay } from "@/lib/admin";
export const GET = adminRoute(async (req) => ({ campaigns: await listCampaigns(q(req).get("status") || "pending"), days: await listSubmittedDays() }));
export const POST = adminRoute(async (req, admin) => {
  const b = (await req.json()) as { action: string; id: string; decision?: "active" | "rejected" | "completed"; views?: number; approve?: boolean };
  if (b.action === "campaign") await decideCampaign(b.id, b.decision!, admin.id);
  else if (b.action === "day") await verifyDay(b.id, Number(b.views) || 0, b.approve !== false);
  return { ok: true };
});
