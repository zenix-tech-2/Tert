import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transferGainsToBalance, WalletError } from "@/lib/wallet";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const body = (await req.json().catch(() => ({}))) as { amount?: number };
    await transferGainsToBalance(user, typeof body.amount === "number" ? Math.floor(body.amount) : undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Transfert impossible." }, { status: 500 });
  }
}
