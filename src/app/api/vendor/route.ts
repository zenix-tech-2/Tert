import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { vendorStatus } from "@/lib/market";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json(await vendorStatus(user.id));
}
