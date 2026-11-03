import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { initiatePayment, PaymentError, publicPayment } from "@/lib/payments";

const schema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("mobile_money"),
    countryCode: z.string().length(2),
    operator: z.string().min(1).max(100),
    phone: z.string().min(6).max(30),
    purpose: z.enum(["activation", "deposit"]).optional(),
    amount: z.number().positive().max(10_000_000).optional(),
  }),
  z.object({
    method: z.literal("crypto"),
    countryCode: z.string().length(2),
    assetCode: z.string().max(60).optional(),
    purpose: z.enum(["activation", "deposit"]).optional(),
    amount: z.number().positive().max(100_000).optional(),
  }),
]);

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données de paiement invalides." }, { status: 422 });
    const payment = await initiatePayment(user, parsed.data);
    return NextResponse.json({ payment: publicPayment(payment) }, { status: 201 });
  } catch (e) {
    if (e instanceof PaymentError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("initiate error", e);
    return NextResponse.json({ error: "Impossible d'initier le paiement." }, { status: 500 });
  }
}
