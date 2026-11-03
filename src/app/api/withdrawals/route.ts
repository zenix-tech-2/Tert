import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listWithdrawals, MIN_CRYPTO_WITHDRAWAL_USD, MIN_WITHDRAWAL, requestWithdrawal, WalletError, XAF_PER_USD } from "@/lib/wallet";

const schema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("mobile_money"), amount: z.number(), operator: z.string().min(1), phone: z.string().min(6), countryCode: z.string().length(2).optional() }),
  z.object({ method: z.literal("crypto"), amountUsd: z.number(), network: z.string().min(1), address: z.string().min(1) }),
]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const items = await listWithdrawals(user.id);
  return NextResponse.json({
    items,
    balance: user.balance,
    balanceUsd: user.balanceUsd,
    min: MIN_WITHDRAWAL,
    max: user.balance,
    minUsd: MIN_CRYPTO_WITHDRAWAL_USD,
    maxUsd: Math.floor((user.balanceUsd / 100 + user.balance / XAF_PER_USD) * 100) / 100,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    const row = await requestWithdrawal(user, parsed.data);
    return NextResponse.json({ withdrawal: row }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Retrait impossible." }, { status: 500 });
  }
}
