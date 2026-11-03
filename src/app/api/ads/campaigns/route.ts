import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { advertiserOverview, createCampaign } from "@/lib/ads";
import { WalletError } from "@/lib/wallet";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().max(2_000_000).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(2000),
  publishText: z.string().trim().min(10).max(2000),
  budget: z.number().positive(),
  currency: z.string().length(3),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  targetCountries: z.array(z.string().length(2)).max(30).optional(),
  targetCities: z.array(z.string().max(60)).max(30).optional(),
  interests: z.array(z.string().max(40)).max(12).optional(),
  ageMin: z.number().int().min(13).max(120).optional(),
  ageMax: z.number().int().min(13).max(120).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json(await advertiserOverview(user.id));
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    const campaign = await createCampaign(user, parsed.data);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Création impossible." }, { status: 500 });
  }
}
