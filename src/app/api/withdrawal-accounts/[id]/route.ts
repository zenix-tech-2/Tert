import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteAccount, setDefaultAccount } from "@/lib/wallet";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  await setDefaultAccount(user.id, id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await ctx.params;
  await deleteAccount(user.id, id);
  return NextResponse.json({ ok: true });
}
