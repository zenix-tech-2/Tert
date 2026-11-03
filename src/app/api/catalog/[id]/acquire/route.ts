import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { acquireItem } from "@/lib/market";
import { WalletError } from "@/lib/wallet";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const r = await acquireItem(user, id);
    return NextResponse.json({ ok: true, accessUrl: r.item.accessUrl, alreadyOwned: r.alreadyOwned, title: r.item.title });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
  }
}
