import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publishCampaign } from "@/lib/ads";
import { WalletError } from "@/lib/wallet";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const { campaignId } = (await req.json()) as { campaignId?: string };
    if (!campaignId) return NextResponse.json({ error: "Campagne requise." }, { status: 422 });
    return NextResponse.json({ publication: await publishCampaign(user, campaignId) }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
  }
}
