import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ensureOwnContact, listContacts } from "@/lib/market";
import { parseFilters } from "@/lib/contact-filters";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  await ensureOwnContact(user).catch(() => {});
  return NextResponse.json(await listContacts(parseFilters(new URL(req.url).searchParams), user.id));
}
