import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { confirmOtp, getPayment, PaymentError, publicPayment } from "@/lib/payments";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  const payment = await getPayment(id, user.id);
  if (!payment) return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  try {
    const body = (await req.json()) as { otp?: string };
    const updated = await confirmOtp(payment, String(body.otp ?? "").trim());
    return NextResponse.json({ payment: publicPayment(updated) });
  } catch (e) {
    if (e instanceof PaymentError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Échec de la confirmation OTP." }, { status: 500 });
  }
}
