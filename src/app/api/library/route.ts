import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listLibrary } from "@/lib/market";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ items: await listLibrary(user.id) });
}
