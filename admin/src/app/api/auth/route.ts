import { NextResponse } from "next/server";
import { currentAdmin, login, logout } from "@/lib/auth";

export async function GET() {
  const a = await currentAdmin();
  return NextResponse.json({ admin: a ? { id: a.id, name: a.name, email: a.email } : null });
}
export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 422 });
  const a = await login(email, password);
  if (!a) return NextResponse.json({ error: "Identifiants invalides ou compte non administrateur." }, { status: 401 });
  return NextResponse.json({ admin: { id: a.id, name: a.name, email: a.email } });
}
export async function DELETE() {
  await logout();
  return NextResponse.json({ ok: true });
}
