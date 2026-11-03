import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findMember } from "@/lib/market";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const m = new URL(req.url).searchParams.get("matricule") || "";
  const member = await findMember(m);
  if (!member) return NextResponse.json({ error: "Aucun membre avec ce matricule." }, { status: 404 });
  const parts = member.name.split(/\s+/);
  const masked = parts.map((p, i) => (i === 0 ? p : p[0] + "•".repeat(Math.max(1, p.length - 1)))).join(" ");
  return NextResponse.json({ member: { name: masked, matricule: member.matricule, countryCode: member.countryCode, active: member.status === "active" } });
}
