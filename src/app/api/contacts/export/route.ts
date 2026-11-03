import { getCurrentUser } from "@/lib/auth";
import { listContacts, recordDownloads } from "@/lib/market";
import { parseFilters } from "@/lib/contact-filters";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non authentifié.", { status: 401 });
  const f = parseFilters(new URL(req.url).searchParams);
  const { items } = await listContacts({ ...f, limit: 500, page: 1 }, user.id);
  await recordDownloads(user.id, items.map((c) => c.id)).catch(() => {});
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Nom", "Téléphone", "Pays", "Ville", "Âge", "Profession", "Sexe"].join(",");
  const lines = items.map((c) => [c.name, c.phone, c.countryName, c.city, c.age, c.profession, c.gender].map(esc).join(","));
  const csv = "\uFEFF" + [header, ...lines].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contacts-dbi-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
