"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Btn, Tabs, Toast, api, fdate, fmt, statusTone } from "@/components/Shell";

type C = { id: string; title: string; description: string; publishText: string; mediaType: string; mediaUrl: string | null; budget: number; currency: string; budgetXaf: number; targetViews: number; views: number; clicks: number; days: number; bonusDays: number; isTest: boolean; status: string; advertiserName: string; advertiserEmail: string; targetCountries: string[]; targetCities: string[]; interests: string[]; ageMin: number; ageMax: number; whatsapp: string | null; website: string | null; createdAt: string };
type D = { d: { id: string; day: number; views: number; proofUrl: string | null; publishedAt: string | null; createdAt: string }; p: { id: string }; title: string; isTest: boolean; publisher: string; publisherEmail: string };

export default function AdsPage() {
  const [status, setStatus] = useState("pending");
  const [data, setData] = useState<{ campaigns: C[]; days: D[] } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [views, setViews] = useState<Record<string, string>>({});
  const load = useCallback(() => fetch(`/api/ads?status=${status}`).then((r) => r.json()).then(setData), [status]);
  useEffect(() => { load(); }, [load]);
  async function act(body: Record<string, unknown>, ok: string) { setMsg(null); try { await api("/api/ads", { method: "POST", body: JSON.stringify(body) }); setMsg({ ok: true, text: ok }); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } }

  return (
    <>
      <Toast msg={msg} />
      <h2 className="text-[22px] font-bold text-ink">Jours à vérifier <span className="ml-2 rounded-lg bg-amber-50 px-2 py-0.5 text-[13px] text-amber-700">{data?.days.length ?? 0}</span></h2>
      <p className="text-[14px] text-gray-500">Captures envoyées par les diffuseurs. Saisissez les vues validées puis payez (1,8 F/vue) ou rejetez.</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {data?.days.map(({ d, title, isTest, publisher, publisherEmail }) => (
          <article key={d.id} className="card flex gap-4 px-4 py-4">
            {d.proofUrl && <a href={d.proofUrl} target="_blank" rel="noreferrer"><img src={d.proofUrl} alt="" className="h-28 w-20 shrink-0 rounded-xl object-cover" /></a>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">{title} {isTest && <Badge tone="amber">test</Badge>}</p>
              <p className="text-[13px] text-gray-500">Jour {d.day} · {publisher} · {publisherEmail}</p>
              <p className="text-[13px] text-gray-500">Déclaré : <strong>{fmt(d.views)}</strong> vues · publié {fdate(d.publishedAt)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input className="input !h-10 !w-32 text-[14px]" inputMode="numeric" placeholder={String(d.views)} value={views[d.id] ?? ""} onChange={(e) => setViews({ ...views, [d.id]: e.target.value.replace(/\D/g, "") })} />
                <Btn small tone="green" onClick={() => act({ action: "day", id: d.id, views: Number(views[d.id] || d.views), approve: true }, "Jour validé et diffuseur payé.")}>Valider & payer</Btn>
                <Btn small tone="red" onClick={() => act({ action: "day", id: d.id, approve: false }, "Jour rejeté.")}>Rejeter</Btn>
              </div>
            </div>
          </article>
        ))}
        {data && data.days.length === 0 && <p className="card px-5 py-8 text-center text-gray-500 lg:col-span-2">Rien à vérifier.</p>}
      </div>

      <h2 className="mt-8 text-[22px] font-bold text-ink">Campagnes</h2>
      <div className="mt-2"><Tabs value={status} onChange={setStatus} items={[{ v: "pending", l: "En validation" }, { v: "active", l: "Actives" }, { v: "completed", l: "Terminées" }, { v: "rejected", l: "Rejetées" }, { v: "all", l: "Toutes" }]} /></div>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        {data?.campaigns.map((c) => (
          <article key={c.id} className="card overflow-hidden">
            {c.mediaUrl && c.mediaType === "image" && <img src={c.mediaUrl} alt="" className="h-44 w-full object-cover" />}
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-2"><p className="text-[17px] font-bold text-ink">{c.title}</p><Badge tone={statusTone(c.status)}>{c.status}</Badge></div>
              <p className="text-[13px] text-gray-500">{c.advertiserName} · {c.advertiserEmail} · {fdate(c.createdAt)}{c.isTest ? " · campagne test" : ""}</p>
              <p className="mt-2 line-clamp-2 text-[14px] text-gray-600">{c.description}</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl bg-surface px-3 py-2 text-[13px] text-gray-700">{c.publishText}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[13px]">
                <div><p className="text-[11px] uppercase text-gray-500">Budget</p><p className="font-bold">{fmt(c.budget)} {c.currency}<span className="block text-[11px] font-normal text-gray-500">≈ {fmt(c.budgetXaf)} F</span></p></div>
                <div><p className="text-[11px] uppercase text-gray-500">Vues</p><p className="font-bold">{fmt(c.views)} / {fmt(c.targetViews)}</p></div>
                <div><p className="text-[11px] uppercase text-gray-500">Durée</p><p className="font-bold">{c.days} j + {c.bonusDays}</p></div>
              </div>
              <p className="mt-2 text-[12px] text-gray-500">Ciblage : {c.targetCountries.length ? c.targetCountries.join(", ") : "tous pays"} · {c.targetCities.length ? c.targetCities.join(", ") : "toutes villes"} · {c.interests.length ? c.interests.join(", ") : "tous intérêts"} · {c.ageMin}-{c.ageMax} ans{c.website ? ` · ${c.website}` : ""}{c.whatsapp ? ` · ${c.whatsapp}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {c.status === "pending" && <><Btn small tone="green" onClick={() => act({ action: "campaign", id: c.id, decision: "active" }, "Campagne activée.")}>Approuver</Btn><Btn small tone="red" onClick={() => act({ action: "campaign", id: c.id, decision: "rejected" }, "Campagne rejetée et budget remboursé.")}>Rejeter & rembourser</Btn></>}
                {c.status === "active" && <Btn small tone="ghost" onClick={() => act({ action: "campaign", id: c.id, decision: "completed" }, "Campagne terminée.")}>Terminer</Btn>}
                {c.status === "rejected" && <Btn small tone="ghost" onClick={() => act({ action: "campaign", id: c.id, decision: "active" }, "Campagne réactivée.")}>Réactiver</Btn>}
              </div>
            </div>
          </article>
        ))}
        {data && data.campaigns.length === 0 && <p className="card px-5 py-8 text-center text-gray-500 lg:col-span-2">Aucune campagne.</p>}
      </div>
    </>
  );
}
