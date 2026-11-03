import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ExternalLink, GraduationCap, Package } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listLibrary } from "@/lib/market";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export default async function BibliothequePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await listLibrary(user.id);
  const icon = (k: string) => (k === "ebook" ? <BookOpen /> : k === "formation" ? <GraduationCap /> : <Package />);
  return (
    <>
      <Link href="/dashboard/boutique" className="flex items-center gap-3 text-[20px] text-gray-600"><ArrowLeft className="h-6 w-6" /> Boutique</Link>
      <section className="card mt-5 px-8 py-8">
        <h1 className="text-[34px] font-semibold text-ink">Ma bibliotheque</h1>
        <p className="mt-1 text-[21px] text-gray-500">{items.length} élément(s) acquis : formations, ebooks et produits.</p>
      </section>
      <div className="mt-6 space-y-4">
        {items.length === 0 && <p className="card px-6 py-12 text-center text-[18px] text-gray-500">Votre bibliothèque est vide. Explorez la boutique, les formations et les ebooks.</p>}
        {items.map((it) => (
          <article key={it.id} className="card flex items-center gap-4 px-5 py-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-soft text-primary [&>svg]:h-8 [&>svg]:w-8">
              {it.coverUrl ? <img src={it.coverUrl} alt="" className="h-full w-full object-cover" /> : icon(it.kind)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[20px] font-bold text-ink">{it.title}</p>
              <p className="text-[15px] text-gray-500">{it.category} · {it.pricePaid === 0 ? "Gratuit" : `${fmt(it.pricePaid)} F`} · {new Date(it.purchasedAt).toLocaleDateString("fr-FR")}</p>
            </div>
            {it.accessUrl && (
              <a href={it.accessUrl} target="_blank" rel="noreferrer" className="flex h-12 items-center gap-2 rounded-xl bg-[#0ea35f] px-4 text-[16px] font-semibold text-white">Ouvrir <ExternalLink className="h-4 w-4" /></a>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
