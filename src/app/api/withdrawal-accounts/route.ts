import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { addAccount, listAccounts, WalletError } from "@/lib/wallet";

const schema = z.object({ operator: z.string().min(1).max(60), countryCode: z.string().length(2), phone: z.string().min(6).max(30), holderName: z.string().max(100).optional() });

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  return NextResponse.json({ accounts: await listAccounts(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    const account = await addAccount(user.id, parsed.data);
    return NextResponse.json({ account }, { status: 201 });
  } catch (e) {
    if (e instanceof WalletError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Impossible d'ajouter le compte." }, { status: 500 });
  }
}
