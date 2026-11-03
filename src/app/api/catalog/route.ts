import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listCatalog } from "@/lib/market";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const p = new URL(req.url).searchParams;
  const kind = p.get("kind");
  if (kind !== "formation" && kind !== "ebook" && kind !== "product") return NextResponse.json({ error: "kind invalide" }, { status: 400 });
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  const sort = p.get("sort");
  const type = p.get("type");
  const data = await listCatalog(
    {
      kind,
      q: p.get("q") || undefined,
      category: p.get("category") || undefined,
      sort: sort === "price_asc" || sort === "price_desc" || sort === "popular" ? sort : "recent",
      min: num("min"),
      max: num("max"),
      type: type === "free" || type === "paid" || type === "promo" ? type : undefined,
      page: num("page"),
    },
    user.id,
  );
  return NextResponse.json(data);
}
