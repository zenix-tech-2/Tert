import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { referralTree, sponsorOf } from "@/lib/referrals";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const [tree, sponsor] = await Promise.all([referralTree(user.referralCode), sponsorOf(user.referredBy)]);
  return NextResponse.json({ code: user.referralCode, sponsor: sponsor?.name ?? null, ...tree });
}
