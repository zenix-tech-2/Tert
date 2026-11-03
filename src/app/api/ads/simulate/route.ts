import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { simulate } from "@/lib/ads";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const b = (await req.json()) as { budget?: number; currency?: string; mediaType?: "image" | "video" };
  if (!b.budget || !b.currency) return NextResponse.json({ error: "Budget requis." }, { status: 422 });
  return NextResponse.json({ simulation: simulate({ budget: Number(b.budget), currency: b.currency, mediaType: b.mediaType === "video" ? "video" : "image" }), balance: user.balance });
}
