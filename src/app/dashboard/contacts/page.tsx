"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, Search, SlidersHorizontal, X } from "lucide-react";

type Contact = { id: string; name: string; phone: string; countryName: string; city: string | null; age: number | null; profession: string | null; gender: string | null; createdAt: string };
type Downloader = { id: string; name: string; countryCode: string; matricule: string | null; at: string };
type Facets = { countries: { code: string; name: string }[]; professions: string[] };

const EMPTY = { from: "", to: "", country: "all", city: "", ageMin: "", ageMax: "", profession: "all", gender: "all" };

export default function ContactsPage() {
  const [tab, setTab] = useState<"targets" | "downloaders">("targets");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [facets, setFacets] = useState<Facets>({ countries: [], professions: [] });
  const [data, setData] = useState<{ items: Contact[]; total: number; page: number; pages: number } | null>(null);
  const [downloaders, setDownloaders] = useState<Downloader[]>([]);
  const [page, setPage] = useState(1);

  const params = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "30" });
    if (q) p.set("q", q);
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== "all") p.set(k, v); });
    return p;
  }, [q, filters, page]);

  useEffect(() => { fetch("/api/contacts/facets").then((r) => r.json()).then(setFacets).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetch(`/api/contacts?${params()}`).then((r) => r.json()).then(setData).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [params]);
  useEffect(() => { if (tab === "downloaders") fetch("/api/contacts/downloaded").then((r) => r.json()).then((d) => setDownloaders(d.items || [])); }, [tab]);

  function exportCsv(withDraft = false) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    Object.entries(withDraft ? draft : filters).forEach(([k, v]) => { if (v && v !== "all") p.set(k, v); });
    window.location.href = `/api/contacts/export?${p}`;
  }

  return (
    <>
      <section className="card px-8 py-8">
        <h1 className="text-[34px] font-semibold text-ink">Contacts</h1>
        <p className="mt-1 text-[21px] leading-snug text-gray-500">Tous les contacts filtres. Consultez, filtrez et exportez les contacts disponibles pour votre compte.</p>

        <div className="mt-7 grid grid-cols-2 gap-4">
          <button type="button" onClick={() => exportCsv()} className="flex h-[88px] items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white text-[22px] font-semibold text-ink"><Download className="h-7 w-7" /> Export</button>
          <button type="button" onClick={() => { setDraft(filters); setOpen(true); }} className="flex h-[88px] items-center justify-center gap-3 rounded-2xl bg-primary text-[22px] font-semibold text-white"><SlidersHorizontal className="h-7 w-7" /> Filtre</button>
        </div>

        <div className="mt-6 space-y-3">
          <TabCard active={tab === "targets"} title="Contacts cibles" sub="Tous les contacts filtres" onClick={() => setTab("targets")} />
          <TabCard active={tab === "downloaders"} title="Ils ont telecharge mon contact" sub="Personnes ayant telecharge votre contact" onClick={() => setTab("downloaders")} />
        </div>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400" />
          <input className="input !h-[84px] !rounded-3xl bg-surface pl-16 text-[20px]" placeholder="Recherche rapide par nom, telephone." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
      </section>

      {tab === "targets" ? (
        <section className="card mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="border-b border-gray-200 bg-surface text-[18px] uppercase tracking-wide text-gray-500">
                <tr><th className="px-6 py-5 font-medium">Nom</th><th className="px-6 py-5 font-medium">Téléphone</th><th className="px-6 py-5 font-medium">Pays</th><th className="px-6 py-5 font-medium">Profil</th></tr>
              </thead>
              <tbody className="text-[20px]">
                {data?.items.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-6 py-6 font-medium text-ink">{c.name}</td>
                    <td className="px-6 py-6 text-gray-700">{c.phone}</td>
                    <td className="px-6 py-6"><p className="text-ink">{c.countryName}</p><p className="text-[16px] text-gray-500">{c.city}</p></td>
                    <td className="px-6 py-6 text-[16px] text-gray-600">{[c.profession, c.age ? `${c.age} ans` : null, c.gender].filter(Boolean).join(" · ")}</td>
                  </tr>
                ))}
                {data && data.items.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucun contact pour ces filtres.</td></tr>}
              </tbody>
            </table>
          </div>
          {data && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-[16px] text-gray-500">
              <span>{data.total} contact(s)</span>
              <div className="flex items-center gap-3">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">‹</button>
                <span>Page {data.page} / {data.pages}</span>
                <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1 disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="card mt-6 divide-y divide-gray-100">
          {downloaders.length === 0 && <p className="px-6 py-12 text-center text-[18px] text-gray-500">Personne n&apos;a encore téléchargé votre contact.</p>}
          {downloaders.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-6 py-5">
              <div><p className="text-[19px] font-semibold text-ink">{d.name}</p><p className="text-[15px] text-gray-500">{d.matricule} · {d.countryCode}</p></div>
              <span className="text-[15px] text-gray-500">{new Date(d.at).toLocaleDateString("fr-FR")}</span>
            </div>
          ))}
        </section>
      )}

      {/* Filter sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-gray-500/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="mx-auto w-full max-w-md rounded-t-[36px] bg-white px-8 pb-10 pt-9" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><h2 className="text-[30px] font-bold text-ink">Filtres contacts</h2><p className="mt-1 text-[20px] text-gray-500">Pays, ville, age, profession et sexe.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gray-100 text-gray-700"><X className="h-6 w-6" /></button>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-4">
              <div><p className="mb-2 text-[18px] font-medium text-gray-500">Date debut</p><input type="date" className="input text-[19px]" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></div>
              <div><p className="mb-2 text-[18px] font-medium text-gray-500">Date fin</p><input type="date" className="input text-[19px]" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></div>
            </div>
            <Sel className="mt-4" value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })}>
              <option value="all">Tous les pays</option>
              {facets.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </Sel>
            <input className="input mt-4 text-[19px]" placeholder="Choisir une ville" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <input className="input text-[19px]" inputMode="numeric" placeholder="Age min" value={draft.ageMin} onChange={(e) => setDraft({ ...draft, ageMin: e.target.value.replace(/\D/g, "") })} />
              <input className="input text-[19px]" inputMode="numeric" placeholder="Age max" value={draft.ageMax} onChange={(e) => setDraft({ ...draft, ageMax: e.target.value.replace(/\D/g, "") })} />
            </div>
            <Sel className="mt-4" value={draft.profession} onChange={(v) => setDraft({ ...draft, profession: v })}>
              <option value="all">Toutes les professions</option>
              {facets.professions.map((p) => <option key={p}>{p}</option>)}
            </Sel>
            <Sel className="mt-4" value={draft.gender} onChange={(v) => setDraft({ ...draft, gender: v })}>
              <option value="all">Sexe</option><option value="M">Homme</option><option value="F">Femme</option>
            </Sel>

            <button type="button" onClick={() => exportCsv(true)} className="mt-7 flex h-[84px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0a9a5c] text-[21px] font-semibold text-white"><Download className="h-7 w-7" /> Telecharger avec ces filtres</button>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button type="button" onClick={() => { setDraft(EMPTY); setFilters(EMPTY); setPage(1); }} className="h-[84px] rounded-2xl border border-gray-300 bg-white text-[21px] font-semibold text-ink">Reinitialiser</button>
              <button type="button" onClick={() => { setFilters(draft); setPage(1); setOpen(false); }} className="h-[84px] rounded-2xl bg-primary text-[21px] font-semibold text-white">Appliquer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabCard({ active, title, sub, onClick }: { active: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={"w-full rounded-2xl border px-6 py-5 text-left transition " + (active ? "border-primary bg-primary-soft" : "border-gray-200 bg-white")}>
      <p className={"text-[22px] font-bold " + (active ? "text-primary" : "text-ink")}>{title}</p>
      <p className={"mt-1 text-[18px] " + (active ? "text-primary/80" : "text-gray-500")}>{sub}</p>
    </button>
  );
}

function Sel({ value, onChange, children, className = "" }: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={"relative " + className}>
      <select className="input appearance-none pr-12 text-[19px]" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
    </div>
  );
}
