import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { chartSeries } from "@/lib/wallet";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const range = new URL(req.url).searchParams.get("range");
  const r = range === "month" || range === "year" ? range : "week";
  return NextResponse.json({ range: r, points: await chartSeries(user.id, r) });
}
