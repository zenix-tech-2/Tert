import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { convert, CONVERSION_RATE, listConversions } from "@/lib/market";
import { WalletError } from "@/lib/wallet";

const schema = z.object({ direction: z.enum(["usd_to_xaf", "xaf_to_usd"]), amount: z.number().positive() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ rate: CONVERSION_RATE, items: await listConversions(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    const row = await convert(user, parsed.data.direction, parsed.data.amount);
    return NextResponse.json({ conversion: row }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Conversion impossible." }, { status: 500 });
  }
}
