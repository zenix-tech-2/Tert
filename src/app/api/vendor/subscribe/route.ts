import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscribeVendor } from "@/lib/market";
import { WalletError } from "@/lib/wallet";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    return NextResponse.json({ subscription: await subscribeVendor(user) }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Souscription impossible." }, { status: 500 });
  }
}
