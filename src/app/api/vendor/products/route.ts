import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createVendorProduct } from "@/lib/market";
import { WalletError } from "@/lib/wallet";

const schema = z.object({
  kind: z.enum(["product", "formation", "ebook"]).default("product"),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(10).max(2000),
  category: z.string().trim().min(2).max(60),
  price: z.number().int().min(0).max(10_000_000),
  promo: z.boolean().default(false),
  coverUrl: z.string().url().optional().or(z.literal("")),
  accessUrl: z.string().url().optional().or(z.literal("")),
  durationLabel: z.string().max(30).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    const d = parsed.data;
    const product = await createVendorProduct(user, { ...d, coverUrl: d.coverUrl || undefined, accessUrl: d.accessUrl || undefined });
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Publication impossible." }, { status: 500 });
  }
}
