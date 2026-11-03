import { adminRoute, q } from "@/lib/api";
import { supportInbox, supportReply, supportThread } from "@/lib/admin";
export const GET = adminRoute(async (req) => (q(req).get("userId") ? supportThread(q(req).get("userId")!) : { inbox: await supportInbox() }));
export const POST = adminRoute(async (req) => { const b = (await req.json()) as { userId: string; body: string; attachmentUrl?: string; attachmentType?: string }; return { message: await supportReply(b.userId, b.body, b.attachmentUrl, b.attachmentType) }; });
