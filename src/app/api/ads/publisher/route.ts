import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { publisherOverview } from "@/lib/ads";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json(await publisherOverview(user.id));
}
