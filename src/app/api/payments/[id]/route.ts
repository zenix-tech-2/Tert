import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPayment, publicPayment, refreshPayment } from "@/lib/payments";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  const payment = await getPayment(id, user.id);
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  const fresh = await refreshPayment(payment);
  return NextResponse.json({ payment: publicPayment(fresh), activated: fresh.status === "success" && fresh.purpose === "activation" });
}
