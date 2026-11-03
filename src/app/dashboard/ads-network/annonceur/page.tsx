"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, BarChart3, CalendarDays, CheckCircle2, Clock, Eye, Image as ImageIcon, Megaphone, Plus, Rocket, Wallet } from "lucide-react";
import CampaignModal from "@/components/app/CampaignModal";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

type Campaign = { id: string; title: string; mediaType: string; mediaUrl: string | null; status: string; budget: number; currency: string; budgetXaf: number; targetViews: number; views: number; clicks: number; days: number; bonusDays: number; createdAt: string };
type Overview = { campaigns: Campaign[]; stats: { total: number; active: number; pending: number; completed: number; spent: number; views: number }; config: { minImage: number; minVideo: number; costPerView: number; days: number; bonusDays: number; publisherPerView: number } };

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En validation", cls: "bg-amber-50 text-amber-700" },
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Terminée", cls: "bg-purple-50 text-purple-700" },
  rejected: { label: "Rejetée", cls: "bg-red-50 text-red-700" },
};

const STEPS = [
  { n: "01", t: "Créez votre annonce", d: "Ajoutez votre visuel, votre texte diffuseur et vos contacts.", icon: <ImageIcon /> },
  { n: "02", t: "Simulez votre budget", d: "Définissez votre budget ou votre objectif de vues avant publication.", icon: <Wallet /> },
  { n: "03", t: "Validation DBI", d: "Notre équipe vérifie la campagne avant de la rendre disponible aux diffuseurs.", icon: <BadgeCheck /> },
  { n: "04", t: "Suivez les performances", d: "Analysez les vues qualifiées, clics et la progression de votre campagne.", icon: <BarChart3 /> },
];

export default function AnnonceurPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [open, setOpen] = useState(false);
  const load = useCallback(() => fetch("/api/ads/campaigns").then((r) => r.json()).then(setOv), []);
  useEffect(() => { load(); }, [load]);
  const cfg = ov?.config ?? { minImage: 5000, minVideo: 10000, costPerView: 3, days: 3, bonusDays: 2, publisherPerView: 1.8 };

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1538e8] to-[#0a1fb3] px-8 pb-9 pt-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-5">
          <Link href="/dashboard/ads-network" aria-label="Retour" className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#c6f135] text-[#0a1fb3]"><ArrowLeft className="h-8 w-8" strokeWidth={2.5} /></Link>
          <h1 className="text-[34px] font-extrabold leading-tight">Mon espace annonceur</h1>
        </div>
        <span className="relative mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-white/15 px-5 text-[15px] font-extrabold tracking-wide"><Megaphone className="h-5 w-5" /> ANNONCEUR DBI</span>
        <p className="relative mt-5 text-[21px] leading-snug text-white/90">Créez votre campagne, ciblez votre audience et payez uniquement pour les vues qualifiées.</p>
        <button type="button" onClick={() => setOpen(true)} className="relative mt-7 inline-flex h-[72px] items-center gap-3 rounded-2xl bg-white px-7 text-[20px] font-bold text-[#1538e8]"><Plus className="h-6 w-6" strokeWidth={3} /> Créer une campagne</button>
      </section>

      <section className="relative mt-7 overflow-hidden rounded-[32px] border border-[#c7d7fb] bg-gradient-to-br from-white to-[#eef3ff] px-8 pb-9 pt-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#dce7ff]" />
        <span className="relative inline-flex h-14 items-center gap-2 rounded-2xl bg-[#e3ebff] px-5 text-[16px] font-extrabold tracking-wide text-[#1538e8]"><Megaphone className="h-5 w-5" /> DEVENIR ANNONCEUR</span>
        <h2 className="relative mt-6 text-[36px] font-extrabold leading-tight text-[#0b1a5c]">Faites connaître votre offre</h2>
        <p className="relative mt-4 text-[20px] leading-snug text-gray-600">Votre publicité est diffusée sur les statuts WhatsApp des membres DBI selon votre audience cible. Vous payez uniquement pour les vues qualifiées et les jours bonus sont offerts.</p>
        <div className="relative mt-7 grid grid-cols-2 gap-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-3xl border border-gray-200 bg-white px-5 py-6">
              <div className="flex items-start gap-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary [&>svg]:h-7 [&>svg]:w-7">{s.icon}</span>
                <p className="text-[19px] font-bold leading-tight text-ink"><span className="mr-1 text-[14px] text-primary">{s.n}</span>{s.t}</p>
              </div>
              <p className="mt-3 pl-2 text-[17px] leading-snug text-gray-500">{s.d}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setOpen(true)} className="relative mt-7 inline-flex h-[72px] items-center gap-3 rounded-2xl bg-[#1538e8] px-7 text-[20px] font-bold text-white"><Plus className="h-6 w-6" strokeWidth={3} /> Créer mon annonce <ArrowRight className="h-6 w-6" /></button>
      </section>

      <div className="mt-8 flex items-start justify-between gap-4">
        <div><h2 className="text-[30px] font-extrabold text-ink">Statistiques annonceur</h2><p className="mt-1 text-[18px] text-gray-500">Vue d&apos;ensemble de vos campagnes publicitaires.</p></div>
        <button type="button" onClick={() => setOpen(true)} className="flex h-[68px] shrink-0 items-center gap-2 rounded-2xl bg-[#1538e8] px-6 text-[19px] font-bold text-white"><Plus className="h-5 w-5" strokeWidth={3} /> Créer</button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <Kpi icon={<Megaphone />} cls="bg-primary-soft text-primary" label="Campagnes" value={ov?.stats.total ?? 0} />
        <Kpi icon={<Rocket />} cls="bg-emerald-50 text-emerald-600" label="Actives" value={ov?.stats.active ?? 0} />
        <Kpi icon={<Clock />} cls="bg-amber-50 text-amber-600" label="En validation" value={ov?.stats.pending ?? 0} />
        <Kpi icon={<CheckCircle2 />} cls="bg-purple-50 text-purple-600" label="Terminées" value={ov?.stats.completed ?? 0} />
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <Mini label="Budget image min." value={`${fmt(cfg.minImage)} FCFA`} />
        <Mini label="Coût/vue" value={`${cfg.costPerView} FCFA`} />
        <Mini label="Jours" value={String(cfg.days)} />
        <Mini label="Bonus" value={String(cfg.bonusDays)} />
      </div>

      <div className="mt-8 flex items-start justify-between">
        <div><h2 className="text-[30px] font-extrabold text-ink">Mes campagnes</h2><p className="mt-1 text-[18px] text-gray-500">Suivez vos campagnes, leurs vues et leur progression.</p></div>
        <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-primary-soft px-3 text-[17px] font-bold text-primary">{ov?.campaigns.length ?? 0}</span>
      </div>
      {ov && ov.campaigns.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-[32px] border-2 border-dashed border-gray-300 px-8 py-14 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-soft text-primary"><CalendarDays className="h-10 w-10" /></span>
          <p className="mt-5 text-[22px] font-bold text-ink">Aucune campagne pour le moment</p>
          <p className="mt-2 text-[17px] text-gray-500">Créez votre première campagne et touchez des milliers de personnes sur WhatsApp.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {ov?.campaigns.map((c) => {
            const st = STATUS[c.status] ?? STATUS.pending;
            const progress = c.targetViews ? Math.min(100, (c.views / c.targetViews) * 100) : 0;
            return (
              <article key={c.id} className="card overflow-hidden">
                {c.mediaUrl && c.mediaType === "image" && <img src={c.mediaUrl} alt="" className="h-48 w-full object-cover" />}
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[21px] font-bold text-ink">{c.title}</p>
                    <span className={"shrink-0 rounded-lg px-3 py-1 text-[14px] font-bold " + st.cls}>{st.label}</span>
                  </div>
                  <p className="mt-1 text-[15px] text-gray-500">{fmt(c.budget)} {c.currency} · {c.days} j + {c.bonusDays} bonus · créée le {new Date(c.createdAt).toLocaleDateString("fr-FR")}</p>
                  <div className="mt-4 flex items-center justify-between text-[16px] text-gray-600"><span className="flex items-center gap-2"><Eye className="h-5 w-5" /> {fmt(c.views)} / {fmt(c.targetViews)} vues</span><span>{fmt(c.clicks)} clics</span></div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CampaignModal open={open} onClose={() => setOpen(false)} onCreated={load} config={cfg} />
    </>
  );
}

function Kpi({ icon, cls, label, value }: { icon: React.ReactNode; cls: string; label: string; value: number }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-6">
      <span className={"flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-7 [&>svg]:w-7 " + cls}>{icon}</span>
      <div><p className="text-[15px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="text-[28px] font-extrabold leading-tight text-ink">{value}</p></div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface px-3 py-4">
      <p className="truncate text-[13px] font-semibold text-gray-500">{label}</p>
      <p className="mt-1 truncate text-[17px] font-bold text-ink">{value}</p>
    </div>
  );
}
