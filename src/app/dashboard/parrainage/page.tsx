"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

type Ref = { id: string; name: string; whatsapp: string; countryCode: string; status: string; level: 1 | 2 | 3; createdAt: string; sponsorName: string | null };
type Lvl = { total: number; active: number; inactive: number; pct: number };
type Data = { code: string; sponsor: string | null; levels: Record<"1" | "2" | "3", Lvl>; total: Lvl; referrals: Ref[] };

const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}%`;

export default function ParrainagePage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState({ level: "all", status: "all", q: "", name: "", phone: "" });
  const [filters, setFilters] = useState(draft);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/referrals", { cache: "no-store" });
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const link = typeof window !== "undefined" && data ? `${window.location.origin}/register?ref=${data.code}` : "";
  const shareText = `Rejoins la DBI (Digital Business Institution) et gagne avec tes statuts WhatsApp : ${link}`;
  const shares = [
    { label: "Partager whatsapp", href: `https://wa.me/?text=${encodeURIComponent(shareText)}`, full: true },
    { label: "Partager facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
    { label: "Partager twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
    { label: "Partager telegram", href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Rejoins la DBI !")}` },
    { label: "Partager linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}` },
  ];

  const rows = useMemo(() => {
    if (!data) return [];
    const q = filters.q.toLowerCase();
    return data.referrals.filter((r) => {
      if (filters.level !== "all" && String(r.level) !== filters.level) return false;
      if (filters.status !== "all" && r.status !== filters.status) return false;
      if (q && !(r.name.toLowerCase().includes(q) || r.whatsapp.includes(q) || (r.sponsorName ?? "").toLowerCase().includes(q))) return false;
      if (filters.name && !r.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.phone && !r.whatsapp.includes(filters.phone)) return false;
      return true;
    });
  }, [data, filters]);

  const levels = data ? [data.levels["1"], data.levels["2"], data.levels["3"]] : [];

  return (
    <>
      <section className="card px-8 py-9">
        <h1 className="text-[36px] font-semibold text-ink">Parrainage</h1>
        <p className="mt-1 text-[21px] leading-snug text-gray-500">Analyse tes filleuls par niveau, statut et performance.</p>

        <div className="mt-7 flex flex-wrap gap-4">
          <span className="flex h-[72px] items-center rounded-2xl bg-primary-soft px-6 text-[22px] font-medium text-primary">Code: {data?.code ?? "…"}</span>
          <button type="button" onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex h-[72px] items-center rounded-2xl border border-gray-300 bg-white px-6 text-[22px] text-ink">{copied ? "Copié !" : "Copier le lien"}</button>
        </div>
        <button type="button" onClick={load} disabled={loading} className="mt-4 flex h-[88px] w-full items-center justify-center rounded-2xl border border-gray-300 bg-white text-[22px] text-ink disabled:opacity-60">{loading ? <span className="spinner !border-primary/30 !border-t-primary" /> : "Actualiser"}</button>

        <div className="mt-8 break-all rounded-2xl border border-gray-200 bg-surface px-8 py-9 text-[21px] text-gray-700">{link || "…"}</div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {shares.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={"flex h-[72px] items-center justify-center rounded-2xl bg-primary-soft px-5 text-[22px] font-medium text-primary " + (s.full ? "col-span-2 justify-self-start px-6" : "")}>{s.label}</a>
          ))}
        </div>
      </section>

      {/* Level cards */}
      <div className="mt-7 grid grid-cols-4 gap-3">
        {data && [{ label: "TOTAL", s: data.total }, ...levels.map((s, i) => ({ label: `LEVEL ${i + 1}`, s }))].map(({ label, s }) => (
          <div key={label} className="card px-4 py-6">
            <p className="text-[15px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 text-[32px] font-bold text-ink">{s.total}</p>
            <span className="mt-4 block rounded-xl bg-emerald-50 px-2 py-2 text-center text-[14px] font-medium text-emerald-700">{s.active} actifs</span>
            <span className="mt-2 block rounded-xl bg-amber-50 px-2 py-2 text-center text-[14px] font-medium text-amber-700">{s.inactive} inactifs</span>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${s.pct}%` }} /></div>
            <p className="mt-2 text-[15px] text-gray-500">{pct(s.pct)} actifs</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {data && (
        <section className="card mt-7 px-8 py-9">
          <h2 className="text-[30px] font-semibold text-ink">Repartition des filleuls</h2>
          <p className="mt-1 text-[21px] text-gray-500">Total, actifs et inactifs par niveau.</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[20px] text-ink">
            <Legend color="#5865f2" label="Total filleuls" /><Legend color="#16a34a" label="Filleuls actifs" /><Legend color="#f59e0b" label="Filleuls inactifs" />
          </div>
          <BarChart levels={levels} />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {levels.map((s, i) => (
              <div key={i} className="rounded-2xl bg-surface px-4 py-6 text-center">
                <p className="text-[19px] text-gray-500">Level {i + 1}</p>
                <p className="mt-1 text-[24px] font-bold text-emerald-600">{pct(s.pct)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="card mt-7 px-8 py-8">
        <h2 className="text-[28px] font-semibold text-ink">Filtres</h2>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Sel value={draft.level} onChange={(v) => setDraft({ ...draft, level: v })}><option value="all">Tous les niveaux</option><option value="1">Level 1</option><option value="2">Level 2</option><option value="3">Level 3</option></Sel>
          <Sel value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })}><option value="all">Tous</option><option value="active">Actifs</option><option value="pending">Inactifs</option></Sel>
          <input className="input col-span-2 text-[19px]" placeholder="Recherche globale" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          <input className="input text-[19px]" placeholder="Nom" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className="input text-[19px]" placeholder="Telephone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <button type="button" onClick={() => setFilters(draft)} className="h-[84px] rounded-2xl bg-primary text-[22px] font-semibold text-white">Appliquer</button>
          <button type="button" onClick={() => { const e = { level: "all", status: "all", q: "", name: "", phone: "" }; setDraft(e); setFilters(e); }} className="h-[84px] rounded-2xl border border-gray-300 bg-white text-[22px] text-ink">Reinitialiser</button>
        </div>
      </section>

      {/* Table */}
      <section className="card mt-7 px-8 py-9">
        <h2 className="text-[30px] font-semibold text-ink">Table des filleuls</h2>
        <p className="mt-1 text-[21px] text-gray-500">{rows.length} resultats</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-[1fr_auto] bg-surface px-8 py-5 text-[18px] uppercase tracking-wide text-gray-500"><span>Filleul</span><span>Niveau</span></div>
          {rows.length === 0 && <p className="px-8 py-10 text-center text-[18px] text-gray-500">Aucun filleul pour le moment. Partagez votre lien !</p>}
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_auto] items-center border-t border-gray-100 px-8 py-6">
              <div className="min-w-0">
                <p className="truncate text-[22px] font-semibold text-ink">{r.name}</p>
                <p className="text-[17px] text-gray-500">{r.whatsapp}{r.sponsorName ? ` · via ${r.sponsorName}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-[21px] text-ink">Level {r.level}</p>
                <span className={"text-[14px] font-semibold " + (r.status === "active" ? "text-emerald-600" : "text-amber-600")}>{r.status === "active" ? "Actif" : "Inactif"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-3"><span className="h-6 w-6 rounded" style={{ background: color }} />{label}</span>;
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-12 text-[19px]" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
    </div>
  );
}

function BarChart({ levels }: { levels: Lvl[] }) {
  const max = Math.max(4, ...levels.map((l) => l.total));
  const step = max <= 10 ? 2 : max <= 40 ? 10 : Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / step) * step;
  const W = 560, H = 360, padL = 60, padB = 50, padT = 20;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / top);
  const groupW = (W - padL - 20) / 3;
  const barW = 26, gap = 6;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 w-full" role="img" aria-label="Répartition des filleuls">
      {ticks.map((t) => (
        <g key={t}><line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#e5e7eb" /><text x={padL - 14} y={y(t) + 6} textAnchor="end" fontSize="18" fill="#374151">{t}</text></g>
      ))}
      {levels.map((l, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const bars = [{ v: l.total, c: "#5865f2" }, { v: l.active, c: "#16a34a" }, { v: l.inactive, c: "#f59e0b" }];
        return (
          <g key={i}>
            {bars.map((b, j) => {
              const x = cx - (barW * 1.5 + gap) + j * (barW + gap);
              const h = Math.max(0, y(0) - y(b.v));
              return <rect key={j} x={x} y={y(b.v)} width={barW} height={h} rx={10} fill={b.c} />;
            })}
            <text x={cx} y={H - 14} textAnchor="middle" fontSize="20" fill="#374151">Level {i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}
