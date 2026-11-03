"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ExternalLink, GraduationCap, Star, Tag } from "lucide-react";
import { useAppUser } from "./AppShell";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

export type Item = {
  id: string;
  kind: string;
  title: string;
  description: string;
  category: string;
  price: number;
  promo: boolean;
  coverUrl: string | null;
  durationLabel: string | null;
  rating: number;
  ratingCount: number;
  sellerName: string;
  owned: boolean;
  accessUrl: string | null;
};

type Data = { items: Item[]; total: number; page: number; pages: number; categories: string[] };

export function CatalogBrowser({
  kind,
  title,
  subtitle,
  countLabel,
  searchPlaceholder,
  actions,
  layout,
  showPriceRange,
  showTypeFilter,
  ctaFree,
  ctaPaid,
}: {
  kind: "formation" | "ebook" | "product";
  title: string;
  subtitle: string;
  countLabel: (n: number) => string;
  searchPlaceholder: string;
  actions?: ReactNode;
  layout: "grid" | "list";
  showPriceRange?: boolean;
  showTypeFilter?: boolean;
  ctaFree: string;
  ctaPaid: (price: number) => string;
}) {
  const { refresh } = useAppUser();
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [type, setType] = useState("all");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    const p = new URLSearchParams({ kind, page: String(page), sort });
    if (q) p.set("q", q);
    if (category !== "all") p.set("category", category);
    if (type !== "all") p.set("type", type);
    if (min) p.set("min", min);
    if (max) p.set("max", max);
    fetch(`/api/catalog?${p}`).then((r) => r.json()).then(setData).catch(() => {});
  }, [kind, page, sort, q, category, type, min, max]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function acquire(item: Item) {
    if (item.accessUrl && (item.owned || item.price === 0)) {
      window.open(item.accessUrl, "_blank", "noopener");
      if (item.owned) return;
    }
    setBusyId(item.id);
    setToast(null);
    const r = await fetch(`/api/catalog/${item.id}/acquire`, { method: "POST" });
    const d = await r.json();
    setBusyId(null);
    if (!r.ok) return setToast({ ok: false, text: d.error || "Opération impossible." });
    setToast({ ok: true, text: d.alreadyOwned ? "Déjà dans votre bibliothèque." : `« ${d.title} » ajouté à votre bibliothèque.` });
    if (d.accessUrl && !item.accessUrl) window.open(d.accessUrl, "_blank", "noopener");
    load();
    refresh();
  }

  return (
    <>
      <section className="card px-8 py-8">
        <h1 className="text-[34px] font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-[21px] leading-snug text-gray-500">{subtitle}</p>
        {data && <p className="mt-2 text-[19px] text-gray-500">{countLabel(data.total)}</p>}
        {actions && <div className="mt-6 flex flex-wrap gap-4">{actions}</div>}

        <input className="input mt-6 text-[19px]" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />

        <div className="mt-4 grid grid-cols-2 gap-4">
          {showTypeFilter && (
            <Select value={type} onChange={(v) => { setType(v); setPage(1); }}>
              <option value="all">Tous les types</option>
              <option value="free">Gratuites</option>
              <option value="paid">Payantes</option>
              <option value="promo">Promo</option>
            </Select>
          )}
          <Select value={category} onChange={(v) => { setCategory(v); setPage(1); }}>
            <option value="all">{showTypeFilter ? "Toutes" : "Toutes les categories"}</option>
            {data?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={sort} onChange={setSort} className={showTypeFilter ? "col-span-2" : ""}>
            <option value="recent">{showTypeFilter ? "Ordre" : "Plus recents"}</option>
            <option value="popular">Plus populaires</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </Select>
          {showPriceRange && (
            <>
              <input className="input text-[19px]" inputMode="numeric" placeholder="Prix min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} />
              <input className="input text-[19px]" inputMode="numeric" placeholder="Prix max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} />
            </>
          )}
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between text-[21px] text-gray-500">
        <span>{layout === "grid" ? "Resultats" : data ? countLabel(data.total) : "…"}</span>
        <span>Page {data?.page ?? 1} sur {data?.pages ?? 1}</span>
      </div>

      {toast && <p className={"mt-4 rounded-2xl px-4 py-3 text-[16px] font-medium " + (toast.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{toast.text}</p>}

      <div className={"mt-4 " + (layout === "grid" ? "grid grid-cols-2 gap-5" : "space-y-6")}>
        {data?.items.map((it) =>
          layout === "grid" ? (
            <GridCard key={it.id} item={it} busy={busyId === it.id} onAcquire={() => acquire(it)} ctaFree={ctaFree} ctaPaid={ctaPaid} />
          ) : (
            <ProductCard key={it.id} item={it} busy={busyId === it.id} onAcquire={() => acquire(it)} ctaFree={ctaFree} ctaPaid={ctaPaid} />
          ),
        )}
        {data && data.items.length === 0 && <p className="col-span-2 py-12 text-center text-[18px] text-gray-500">Aucun résultat.</p>}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-12 rounded-xl border border-gray-300 bg-white px-5 text-[17px] font-semibold disabled:opacity-40">Précédent</button>
          <span className="text-[17px] text-gray-500">{page} / {data.pages}</span>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="h-12 rounded-xl border border-gray-300 bg-white px-5 text-[17px] font-semibold disabled:opacity-40">Suivant</button>
        </div>
      )}
    </>
  );
}

function Select({ value, onChange, children, className = "" }: { value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <div className={"relative " + className}>
      <select className="input appearance-none pr-12 text-[19px]" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
    </div>
  );
}

function Badges({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap gap-2">
      {item.owned ? (
        <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[17px] font-semibold text-emerald-700">Accessible</span>
      ) : item.price === 0 ? (
        <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[17px] font-semibold text-emerald-700">Gratuite</span>
      ) : (
        <span className="rounded-full bg-sky-50 px-4 py-1.5 text-[17px] font-semibold text-sky-700">Payante</span>
      )}
      {item.promo && <span className="rounded-full bg-amber-50 px-4 py-1.5 text-[17px] font-semibold text-amber-600">Promo</span>}
    </div>
  );
}

function GridCard({ item, busy, onAcquire, ctaFree, ctaPaid }: { item: Item; busy: boolean; onAcquire: () => void; ctaFree: string; ctaPaid: (p: number) => string }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-500 to-indigo-900">
        {item.coverUrl ? <img src={item.coverUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white"><GraduationCap className="h-16 w-16" /></div>}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
        <Badges item={item} />
        <h3 className="mt-4 line-clamp-2 text-[22px] font-bold uppercase leading-tight text-ink">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-[18px] leading-snug text-gray-500">{item.description}</p>
        <div className="mt-3 flex items-center justify-between text-[19px]">
          <span className="font-bold text-ink">{fmt(item.price)} FCFA</span>
          {item.durationLabel && <span className="text-gray-500">{item.durationLabel}</span>}
        </div>
        <button type="button" disabled={busy} onClick={onAcquire} className="mt-4 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0ea35f] px-3 text-[19px] font-semibold leading-tight text-white disabled:opacity-60">
          {busy ? <span className="spinner" /> : item.owned ? <>Ouvrir <ExternalLink className="h-5 w-5" /></> : item.price === 0 ? ctaFree : ctaPaid(item.price)}
        </button>
      </div>
    </article>
  );
}

function ProductCard({ item, busy, onAcquire, ctaFree, ctaPaid }: { item: Item; busy: boolean; onAcquire: () => void; ctaFree: string; ctaPaid: (p: number) => string }) {
  return (
    <article className="card overflow-hidden">
      <div className="relative h-[420px] bg-gradient-to-br from-[#0fa362] via-[#1b2a56] to-[#3b1a7a]">
        {item.coverUrl && <img src={item.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-8">
          {item.promo ? <span className="flex items-center gap-2 rounded-full bg-[#f0262c] px-6 py-3 text-[18px] font-extrabold text-white"><Tag className="h-5 w-5" /> PROMO</span> : <span />}
          <span className="rounded-full bg-white/20 px-6 py-3 text-[18px] font-bold text-white backdrop-blur">{item.category}</span>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <GraduationCap className="h-20 w-20 text-black/80" />
          <p className="mt-6 text-[44px] font-extrabold leading-none text-gray-200">DBI</p>
          <p className="mt-2 text-[22px] text-gray-300">{item.sellerName === "DBI Academy" ? "Academy" : item.sellerName}</p>
        </div>
        <div className="absolute bottom-8 left-8 flex items-center gap-1 text-white">
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={"h-6 w-6 " + (i < item.rating ? "fill-white" : "")} />)}
          <span className="ml-2 text-[20px] font-semibold">({item.ratingCount})</span>
        </div>
      </div>
      <div className="px-8 pb-8 pt-6">
        <h3 className="text-[26px] font-bold leading-tight text-ink">{item.title}</h3>
        <p className="mt-2 line-clamp-3 text-[18px] leading-snug text-gray-500">{item.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-[28px] font-extrabold text-ink">{item.price === 0 ? "Gratuit" : `${fmt(item.price)} FCFA`}</span>
          <button type="button" disabled={busy} onClick={onAcquire} className="flex h-16 items-center gap-2 rounded-2xl bg-primary px-6 text-[19px] font-bold text-white disabled:opacity-60">
            {busy ? <span className="spinner" /> : item.owned ? <>Ouvrir <ExternalLink className="h-5 w-5" /></> : item.price === 0 ? ctaFree : ctaPaid(item.price)}
          </button>
        </div>
      </div>
    </article>
  );
}
