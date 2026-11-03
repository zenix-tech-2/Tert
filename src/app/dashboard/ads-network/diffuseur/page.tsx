"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, ChevronDown, Clock, Copy, Eye, Globe, Link2, Lock, MapPin, Megaphone, MessageCircle, ShieldCheck, Upload, Wallet, Zap } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const fdate = (d: string | Date | null | undefined) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

type Campaign = { id: string; title: string; description: string; publishText: string; mediaType: string; mediaUrl: string | null; trackingCode: string; advertiser: string; taken: boolean; progress: number; isTest: boolean; days: number; targetCountries: string[]; targetCities: string[] };
type Day = { id: string; day: number; status: string; publishedAt: string | null; dueAt: string | null; views: number; verifiedViews: number; proofUrl: string | null };
type Pub = { id: string; status: string; views: number; verifiedViews: number; clicks: number; earned: number; expiresAt: string | null; createdAt: string; campaign: { id: string; title: string; description: string; publishText: string; mediaUrl: string | null; trackingCode: string; isTest: boolean; days: number; targetCountries: string[]; targetCities: string[] }; days: Day[] };
type Data = { testDone: boolean; lockedCount: number; available: Campaign[]; mine: Pub[]; stats: { verifiedViews: number; earned: number; avg: number; score: number; estimation: number; campaigns: number }; perView: number; rules: string[]; verifyAfterHours: number; verifyWindowMinutes: number };

const DAY_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  published: { label: "Publié", cls: "border-sky-300 bg-sky-50 text-sky-700" },
  submitted: { label: "En vérification", cls: "border-amber-300 bg-amber-50 text-amber-700" },
  verified: { label: "Validé", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejeté", cls: "border-red-300 bg-red-50 text-red-700" },
};

export default function DiffuseurPage() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"current" | "history">("current");
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => fetch("/api/ads/publisher").then((r) => r.json()).then((d: Data) => { setData(d); setSelected((s) => s ?? d.mine.find((m) => m.status === "accepted")?.id ?? null); }), []);
  useEffect(() => { load(); }, [load]);

  async function take(c: Campaign) {
    setMsg(null);
    const r = await fetch("/api/ads/publisher/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: c.id }) });
    const d = await r.json();
    if (!r.ok) return setMsg({ ok: false, text: d.error });
    setSelected(d.publication.id);
    await load();
    detailRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const current = data?.mine.filter((m) => m.status === "accepted") ?? [];
  const history = data?.mine.filter((m) => m.status !== "accepted") ?? [];
  const list = tab === "current" ? current : history;
  const sel = data?.mine.find((m) => m.id === selected) ?? null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#17a862] to-[#0a5a3a] px-8 pb-9 pt-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-24 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-5">
          <Link href="/dashboard/ads-network" aria-label="Retour" className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white/20"><ArrowLeft className="h-8 w-8" strokeWidth={2.5} /></Link>
          <h1 className="text-[34px] font-extrabold leading-tight">Mon espace diffuseur</h1>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-3">
          <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/15 px-5 text-[15px] font-extrabold tracking-wide"><Megaphone className="h-5 w-5" /> DIFFUSEUR DBI</span>
          <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/15 px-5 text-[15px] font-extrabold tracking-wide"><span className="h-3 w-3 rounded-full bg-[#c6f135]" /> ACTIF</span>
        </div>
        <p className="relative mt-5 max-w-[80%] text-[21px] leading-snug text-white/90">Publiez les campagnes sur WhatsApp, faites valider vos vues et gagnez selon vos performances.</p>
        <div className="relative mt-7 inline-flex items-center gap-4 rounded-2xl bg-white/15 px-6 py-4">
          <Wallet className="h-9 w-9" />
          <div><p className="text-[14px] font-extrabold uppercase tracking-wide text-white/80">Gains</p><p className="text-[26px] font-extrabold leading-tight">{fmt(data?.stats.earned ?? 0)} FCFA</p></div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Kpi icon={<Eye />} cls="bg-primary-soft text-primary" label="Vues validées" value={fmt(data?.stats.verifiedViews ?? 0)} />
        <Kpi icon={<Wallet />} cls="bg-emerald-50 text-emerald-600" label="Gains" value={`${fmt(data?.stats.earned ?? 0)} FCFA`} />
        <Kpi icon={<BarChart3 />} cls="bg-purple-50 text-purple-600" label="Moyenne" value={fmt(data?.stats.avg ?? 0)} />
        <Kpi icon={<ShieldCheck />} cls="bg-amber-50 text-amber-600" label="Score" value={String(data?.stats.score ?? 50)} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Mini label="Estimation" value={fmt(data?.stats.estimation ?? 500)} />
        <Mini label="Campagnes" value={String(data?.stats.campaigns ?? 0)} />
        <Mini label="Test" value={data?.testDone ? "Validé" : "À faire"} />
      </div>

      {data && !data.testDone && (
        <div className="mt-6 flex gap-5 rounded-[28px] border border-amber-300 bg-amber-50 px-7 py-7">
          <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><Zap className="h-8 w-8" /></span>
          <div><p className="text-[22px] font-bold text-amber-900">Campagne test requise</p><p className="mt-1 text-[18px] leading-snug text-amber-800">Validez d&apos;abord une campagne test pour débloquer les campagnes rémunérées{data.lockedCount ? ` (${data.lockedCount} en attente)` : ""}.</p></div>
        </div>
      )}

      {msg && <p className={"mt-5 rounded-2xl px-4 py-3 text-[16px] font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p>}

      {/* Available */}
      <SectionHead icon={<Megaphone />} title="Campagnes disponibles" count={data?.available.length ?? 0} />
      <div className="mt-5 space-y-5">
        {data && data.available.length === 0 && <div className="rounded-[32px] border-2 border-dashed border-gray-300 px-8 py-12 text-center text-[18px] text-gray-500">Aucune campagne disponible pour le moment.</div>}
        {data?.available.map((c) => (
          <article key={c.id} className="card overflow-hidden">
            <div className="relative aspect-[16/9] bg-gray-100">
              {c.mediaUrl && <img src={c.mediaUrl} alt="" className="h-full w-full object-cover" />}
              <span className="absolute left-5 top-5 rounded-full border border-emerald-200 bg-emerald-50/95 px-5 py-2 text-[17px] font-bold text-emerald-700">Active</span>
              {c.isTest && <span className="absolute right-5 top-5 rounded-full bg-[#f5c400] px-5 py-2 text-[17px] font-bold text-[#1e1bb3]">Campagne test</span>}
            </div>
            <div className="px-7 py-6">
              <h3 className="text-[26px] font-extrabold uppercase leading-tight text-ink">{c.title}</h3>
              <p className="mt-3 line-clamp-2 text-[19px] leading-snug text-gray-500">{c.description}</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <Tile icon={<Globe />} label="Pays" value={c.targetCountries.length ? c.targetCountries.join(", ") : "Tous"} />
                <Tile icon={<MapPin />} label="Villes" value={c.targetCities.length ? c.targetCities.join(", ") : "Tous"} />
              </div>
              <div className="mt-4 rounded-2xl bg-surface px-6 py-5">
                <div className="flex items-center justify-between text-[19px]"><span className="flex items-center gap-3 text-gray-600"><BarChart3 className="h-5 w-5" /> Progression</span><span className="font-bold text-ink">{c.progress}%</span></div>
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${c.progress}%` }} /></div>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface px-6 py-6 text-[19px] leading-snug text-gray-600">{c.publishText}</p>
              <button type="button" onClick={() => (c.taken ? (setSelected(data?.mine.find((m) => m.campaign.id === c.id)?.id ?? null), detailRef.current?.scrollIntoView({ behavior: "smooth" })) : take(c))} className="mt-5 flex h-[76px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0ea35f] text-[20px] font-bold text-white">
                {c.taken ? (c.isTest ? "Reprendre la campagne test" : "Reprendre la campagne") : c.isTest ? "Commencer la campagne test" : "Je publie cette campagne"} <ArrowRight className="h-6 w-6" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Mine */}
      <div ref={detailRef}>
        <SectionHead icon={<CheckCircle2 />} title="Mes campagnes" count={data?.mine.length ?? 0} />
      </div>
      {sel && data && <PublicationDetail pub={sel} data={data} onChange={load} onMsg={setMsg} />}

      <div className="mt-6 grid grid-cols-2 rounded-[28px] bg-gray-100 p-2">
        {(["current", "history"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={"flex h-[72px] items-center justify-center gap-3 rounded-[22px] text-[20px] font-bold " + (tab === t ? "bg-white text-primary shadow" : "text-gray-500")}>
            {t === "current" ? "En cours" : "Historique"} <span className={"rounded-full px-3 py-1 text-[14px] " + (tab === t ? "bg-primary-soft text-primary" : "bg-gray-200 text-gray-600")}>{t === "current" ? current.length : history.length}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {list.length === 0 && <p className="py-8 text-center text-[17px] text-gray-500">{tab === "current" ? "Aucune campagne en cours." : "Aucun historique."}</p>}
        {list.map((m) => {
          const done = m.days.filter((d) => ["submitted", "verified"].includes(d.status)).length;
          return (
            <button key={m.id} type="button" onClick={() => { setSelected(m.id); detailRef.current?.scrollIntoView({ behavior: "smooth" }); }} className={"flex w-full items-center gap-4 rounded-[24px] border-2 bg-white px-5 py-4 text-left " + (selected === m.id ? "border-primary" : "border-gray-200")}>
              <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">{m.campaign.mediaUrl && <img src={m.campaign.mediaUrl} alt="" className="h-full w-full object-cover" />}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-[19px] font-bold text-ink">{m.campaign.title}</p><p className="text-[15px] text-gray-500">{m.campaign.days - done}/{m.campaign.days} journées disponibles</p></div>
              <span className={"shrink-0 rounded-full border px-4 py-2 text-[16px] font-bold " + (m.status === "completed" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700")}>{m.status === "completed" ? "Terminée" : "Acceptée"}</span>
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function PublicationDetail({ pub, data, onChange, onMsg }: { pub: Pub; data: Data; onChange: () => Promise<void>; onMsg: (m: { ok: boolean; text: string } | null) => void }) {
  const [dayIdx, setDayIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [rules, setRules] = useState(false);
  const [proof, setProof] = useState<{ url: string; views: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const firstOpen = pub.days.findIndex((d) => !["submitted", "verified"].includes(d.status));
    setDayIdx(firstOpen === -1 ? pub.days.length - 1 : firstOpen);
    setProof(null);
  }, [pub.id, pub.days]);

  const c = pub.campaign;
  const day = pub.days[dayIdx];
  const link = typeof window !== "undefined" ? `${window.location.origin}/r/${c.trackingCode}` : "";
  const fullText = `${c.publishText}\n\n${link}`;
  const done = pub.days.filter((d) => ["submitted", "verified"].includes(d.status)).length;
  const st = DAY_STATUS[day?.status ?? "pending"];
  const locked = (i: number) => i > 0 && !["submitted", "verified"].includes(pub.days[i - 1]?.status);

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    onMsg(null);
    const r = await fetch("/api/ads/publisher/proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return onMsg({ ok: false, text: d.error });
    if (body.action === "publish") onMsg({ ok: true, text: `Jour ${day.day} marqué comme publié. Revenez dans ${data.verifyAfterHours} h pour la vérification.` });
    else onMsg({ ok: true, text: c.isTest ? "Campagne test validée ! Les campagnes rémunérées sont débloquées." : "Capture envoyée. Vos vues seront vérifiées puis créditées." });
    setProof(null);
    await onChange();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => setProof((p) => ({ url: String(rd.result), views: p?.views ?? "" }));
    rd.readAsDataURL(f);
  }

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(i); }, []);
  const canVerify = day?.status === "published" && (c.isTest || (day.publishedAt && now - new Date(day.publishedAt).getTime() >= data.verifyAfterHours * 3600 * 1000));

  return (
    <article className="card mt-5 overflow-hidden">
      <div className="aspect-[16/9] bg-gray-100">{c.mediaUrl && <img src={c.mediaUrl} alt="" className="h-full w-full object-cover" />}</div>
      <div className="px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[26px] font-extrabold uppercase leading-tight text-ink">{c.title}</h3>
          <span className={"shrink-0 rounded-full border px-5 py-2 text-[17px] font-bold " + (pub.status === "completed" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700")}>{pub.status === "completed" ? "Terminée" : "Acceptée"}</span>
        </div>
        <p className="mt-3 text-[19px] leading-snug text-gray-500">{c.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[16px] text-gray-500"><span className="flex items-center gap-2"><Clock className="h-5 w-5" /> Expire le {fdate(pub.expiresAt)}</span><span>{done} journée(s) sur {c.days}</span></div>

        <div className="mt-5 grid grid-cols-2 border-y border-gray-200">
          <Cell label="Vues validées" value={fmt(pub.verifiedViews)} r b /><Cell label="Clics" value={fmt(pub.clicks)} b />
          <Cell label="Clics uniques" value={fmt(pub.clicks)} r /><Cell label="Progression" value={`${done}/${c.days}`} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {pub.days.map((d, i) => (
            <button key={d.id} type="button" disabled={locked(i)} onClick={() => setDayIdx(i)} className={"flex h-[76px] items-center justify-center gap-2 rounded-2xl text-[19px] font-bold " + (i === dayIdx ? "bg-[#1d4ed8] text-white" : locked(i) ? "bg-gray-100 text-gray-400" : "border border-gray-200 bg-white text-ink")}>
              {locked(i) && <Lock className="h-5 w-5" />} Jour {d.day}
            </button>
          ))}
        </div>

        {day && (
          <>
            <hr className="my-6 border-gray-200" />
            <div className="flex items-center justify-between"><h4 className="text-[24px] font-bold text-ink">Publication du jour {day.day}</h4><span className={"rounded-full border px-5 py-2 text-[17px] font-bold " + st.cls}>{st.label}</span></div>
            <p className="mt-5 text-[15px] font-bold uppercase tracking-wide text-gray-500">Texte complet à publier</p>
            <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-surface px-6 py-6 text-[18px] leading-relaxed text-gray-700">{fullText}</p>
            <a href={link} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-3 rounded-2xl bg-[#eaf1ff] px-6 py-5 text-[16px] font-bold text-[#1d4ed8]"><Link2 className="h-6 w-6 shrink-0" /><span className="truncate">{link}</span></a>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => { navigator.clipboard?.writeText(fullText); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="flex h-[72px] items-center gap-2 rounded-2xl border border-gray-300 bg-white px-6 text-[18px] font-bold text-ink">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />} {copied ? "Copié" : "Copier"}</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(fullText)}`} target="_blank" rel="noreferrer" className="flex h-[72px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1fb45a] px-5 text-[18px] font-bold text-white"><MessageCircle className="h-6 w-6" /> Partager sur statut WhatsApp</a>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-y-5 border-t border-gray-200 pt-6">
              <div><p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">Vues</p><p className="mt-1 text-[19px] font-bold text-ink">{fmt(day.views)}</p></div>
              <div><p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">Échéance</p><p className="mt-1 text-[19px] font-bold text-ink">{fdate(day.dueAt)}</p></div>
              <div><p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">Vérification</p><span className={"mt-2 inline-block rounded-full border px-4 py-1.5 text-[15px] font-bold " + st.cls}>{st.label}</span></div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-amber-300 bg-amber-50">
              <div className="flex gap-5 px-6 py-6">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-400 text-white"><Clock className="h-8 w-8" /></span>
                <div><p className="text-[21px] font-bold text-amber-900">Important avant de vérifier</p><p className="mt-2 text-[18px] font-semibold leading-snug text-amber-800">Attendez au moins {data.verifyAfterHours} h, puis vérifiez entre {data.verifyAfterHours} h 00 et {data.verifyAfterHours} h {data.verifyWindowMinutes}. Ne supprimez pas le statut avant la vérification.</p></div>
              </div>
              <button type="button" onClick={() => setRules((r) => !r)} className="flex w-full items-center justify-center gap-3 border-t border-amber-200 bg-amber-100/70 py-5 text-[18px] font-bold text-amber-900"><ChevronDown className={"h-5 w-5 transition " + (rules ? "rotate-180" : "")} /> Voir toutes les règles</button>
              {rules && <ul className="space-y-2 border-t border-amber-200 px-8 py-5 text-[16px] text-amber-900">{data.rules.map((r) => <li key={r} className="list-disc">{r}</li>)}</ul>}
            </div>

            {day.status === "pending" && (
              <button type="button" disabled={busy} onClick={() => action({ action: "publish", dayId: day.id })} className="mt-6 flex h-[84px] w-full items-center justify-center gap-3 rounded-2xl bg-[#0ea35f] text-[21px] font-bold text-white disabled:opacity-60"><MessageCircle className="h-7 w-7" /> Publier le jour {day.day}</button>
            )}
            {day.status === "published" && (
              proof ? (
                <div className="mt-6 rounded-2xl bg-surface p-5">
                  <p className="text-[17px] font-bold text-ink">Capture d&apos;écran de votre statut</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 flex min-h-[80px] w-full items-center gap-4 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 text-[17px] font-semibold text-gray-700">{proof.url ? <img src={proof.url} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <Upload className="h-6 w-6 text-primary" />}{proof.url ? "Changer la capture" : "Ajouter la capture"}</button>
                  <input className="input mt-3 bg-white" inputMode="numeric" placeholder="Nombre de vues affiché" value={proof.views} onChange={(e) => setProof({ ...proof, views: e.target.value.replace(/\D/g, "") })} />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setProof(null)} className="h-14 rounded-xl border border-gray-300 bg-white text-[16px] font-semibold">Annuler</button>
                    <button type="button" disabled={busy || !proof.url || !proof.views} onClick={() => action({ action: "proof", dayId: day.id, proofUrl: proof.url, views: Number(proof.views) })} className="h-14 rounded-xl bg-primary text-[16px] font-semibold text-white disabled:opacity-50">{busy ? <span className="spinner" /> : "Envoyer"}</button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={!canVerify} onClick={() => setProof({ url: "", views: "" })} className="mt-6 flex h-[84px] w-full items-center justify-center gap-3 rounded-2xl bg-primary text-[21px] font-bold text-white disabled:opacity-50"><Eye className="h-7 w-7" /> {canVerify ? `Vérifier le jour ${day.day}` : `Vérification disponible le ${fdate(day.dueAt)}`}</button>
              )
            )}
          </>
        )}
      </div>
    </article>
  );
}

function SectionHead({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="mt-8 flex items-center gap-4">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary [&>svg]:h-7 [&>svg]:w-7">{icon}</span>
      <h2 className="flex-1 text-[27px] font-extrabold text-ink">{title}</h2>
      <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-gray-100 px-3 text-[17px] font-bold text-gray-600">{count}</span>
    </div>
  );
}
function Kpi({ icon, cls, label, value }: { icon: React.ReactNode; cls: string; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-6">
      <span className={"flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-7 [&>svg]:w-7 " + cls}>{icon}</span>
      <div className="min-w-0"><p className="truncate text-[14px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="truncate text-[26px] font-extrabold leading-tight text-ink">{value}</p></div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-surface px-4 py-5 text-center"><p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-[22px] font-extrabold text-ink">{value}</p></div>;
}
function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-surface px-5 py-5"><p className="flex items-center gap-2 text-[17px] text-gray-500 [&>svg]:h-5 [&>svg]:w-5">{icon} {label}</p><p className="mt-1 truncate text-[20px] font-bold text-ink">{value}</p></div>;
}
function Cell({ label, value, r, b }: { label: string; value: string; r?: boolean; b?: boolean }) {
  return <div className={"px-4 py-6 text-center " + (r ? "border-r border-gray-200 " : "") + (b ? "border-b border-gray-200" : "")}><p className="text-[14px] font-bold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-[22px] font-bold text-ink">{value}</p></div>;
}
