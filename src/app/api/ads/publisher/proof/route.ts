import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publishDay, submitDayProof } from "@/lib/ads";
import { WalletError } from "@/lib/wallet";

/** action: "publish" (mark day as posted) | "proof" (submit screenshot + views) */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const b = (await req.json()) as { action?: string; dayId?: string; proofUrl?: string; views?: number };
    if (!b.dayId) return NextResponse.json({ error: "Jour requis." }, { status: 422 });
    if (b.action === "publish") return NextResponse.json({ day: await publishDay(user, b.dayId) });
    if (!b.proofUrl) return NextResponse.json({ error: "Capture d'écran requise." }, { status: 422 });
    return NextResponse.json({ day: await submitDayProof(user, b.dayId, b.proofUrl, Number(b.views) || 0) });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Opération impossible." }, { status: 500 });
  }
}
