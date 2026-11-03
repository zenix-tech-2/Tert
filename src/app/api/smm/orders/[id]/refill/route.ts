import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestRefill, SmmError } from "@/lib/smm";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    return NextResponse.json({ ok: true, result: await requestRefill(user, id) });
  } catch (e) {
    if (e instanceof SmmError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Refill impossible." }, { status: 500 });
  }
}
