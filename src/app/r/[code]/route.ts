import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns } from "@/db/schema";

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const [c] = await db.update(adCampaigns).set({ clicks: sql`${adCampaigns.clicks} + 1` }).where(eq(adCampaigns.trackingCode, code)).returning({ website: adCampaigns.website, whatsapp: adCampaigns.whatsapp, phone: adCampaigns.phone });
  const origin = new URL(req.url).origin;
  if (!c) return NextResponse.redirect(`${origin}/register`);
  if (c.website) return NextResponse.redirect(c.website);
  if (c.whatsapp) return NextResponse.redirect(`https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`);
  if (c.phone) return NextResponse.redirect(`tel:${c.phone}`);
  return NextResponse.redirect(`${origin}/register`);
}
