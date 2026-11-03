import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { estimateTransfer, TRANSFER_FEE_PCT, TRANSFER_MIN, transferToMember } from "@/lib/market";
import { WalletError } from "@/lib/wallet";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ balance: user.balance, feePct: TRANSFER_FEE_PCT, min: TRANSFER_MIN });
}

const schema = z.object({ matricule: z.string().min(4).max(40), amount: z.number().positive(), estimateOnly: z.boolean().optional() });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    if (parsed.data.estimateOnly) return NextResponse.json({ estimate: estimateTransfer(Math.floor(parsed.data.amount)) });
    const result = await transferToMember(user, parsed.data.matricule, parsed.data.amount);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Transfert impossible." }, { status: 500 });
  }
}
