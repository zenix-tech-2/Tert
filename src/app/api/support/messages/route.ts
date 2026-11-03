import { NextResponse } from "next/server";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { supportMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  body: z.string().max(4000).default(""),
  attachmentUrl: z.string().max(3_000_000).optional(),
  attachmentType: z.enum(["image", "audio"]).optional(),
}).refine((d) => d.body.trim() || d.attachmentUrl, { message: "Message vide." });

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const after = new URL(req.url).searchParams.get("after");
  const cond = after ? and(eq(supportMessages.userId, user.id), gt(supportMessages.createdAt, new Date(after))) : eq(supportMessages.userId, user.id);
  const items = await db.select().from(supportMessages).where(cond).orderBy(asc(supportMessages.createdAt)).limit(300);
  // mark support messages as read
  await db.update(supportMessages).set({ readAt: new Date() }).where(and(eq(supportMessages.userId, user.id), eq(supportMessages.sender, "support"), isNull(supportMessages.readAt)));
  return NextResponse.json({ items, supportName: "Support DBI" });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  const d = parsed.data;
  const [msg] = await db.insert(supportMessages).values({ userId: user.id, sender: "user", body: d.body.trim(), attachmentUrl: d.attachmentUrl || null, attachmentType: d.attachmentType || null }).returning();
  // First-contact auto reply so the member knows the line is live.
  const [{ count }] = await db.select({ count: supportMessages.id }).from(supportMessages).where(and(eq(supportMessages.userId, user.id), eq(supportMessages.sender, "support"))).limit(1).then((r) => (r.length ? [{ count: 1 }] : [{ count: 0 }]));
  let reply = null;
  if (!count) {
    [reply] = await db.insert(supportMessages).values({ userId: user.id, sender: "support", body: `Bonjour ${user.name.split(/\s+/)[0]} 👋 Merci pour votre message. Un membre de l'équipe DBI vous répond dans les plus brefs délais (généralement sous 24 h).` }).returning();
  }
  return NextResponse.json({ message: msg, reply }, { status: 201 });
}
