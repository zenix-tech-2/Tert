"use client";

import { useEffect, useState } from "react";
import { Badge, Kpi, Pager, Tabs, fdate, fmt, statusTone } from "@/components/Shell";

type O = { id: string; userName: string; userEmail: string; provider: string; serviceId: number; serviceName: string; link: string; quantity: number; priceXaf: number; costUsd: number; providerOrderId: string | null; status: string; remains: number | null; createdAt: string };
type P = { id: string; label: string; configured: boolean; balance: string | null; currency: string | null; url: string };

export default function SmmPage() {
  const [status, setStatus] = useState("all"); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: O[]; total: number; pages: number; revenueXaf: number; costUsdCents: number; providers: P[] } | null>(null);
  useEffect(() => { fetch(`/api/smm?status=${status}&page=${page}`).then((r) => r.json()).then(setData); }, [status, page]);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data?.providers.map((p) => <Kpi key={p.id} label={p.label} value={p.configured ? (p.balance ? `${p.balance} ${p.currency}` : "Clé OK") : "Bientôt"} sub={p.configured ? p.url : "Clé API non configurée"} cls={p.configured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"} />)}
        <Kpi label="Chiffre d'affaires" value={`${fmt(data?.revenueXaf ?? 0)} F`} />
        <Kpi label="Coût fournisseurs" value={`${((data?.costUsdCents ?? 0) / 100).toFixed(2)} $`} />
      </div>
      <div className="mt-5"><Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ v: "all", l: "Toutes" }, { v: "in_progress", l: "En cours" }, { v: "completed", l: "Terminées" }, { v: "partial", l: "Partielles" }, { v: "failed", l: "Échouées" }, { v: "canceled", l: "Annulées" }]} /></div>
      <section className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Membre</th><th>Fournisseur</th><th>Service</th><th>Lien</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Coût</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{data?.items.map((o) => <tr key={o.id}><td className="px-5 py-3 font-semibold text-ink">{o.userName}<p className="text-[12px] font-normal text-gray-500">{o.userEmail}</p></td><td>{o.provider}<p className="text-[11px] text-gray-500">#{o.providerOrderId ?? "—"}</p></td><td className="max-w-[220px] truncate">{o.serviceName}<p className="text-[11px] text-gray-500">ID {o.serviceId}</p></td><td className="max-w-[180px] truncate"><a href={o.link} target="_blank" rel="noreferrer" className="text-primary">{o.link}</a></td><td className="text-right">{fmt(o.quantity)}{o.remains !== null ? <p className="text-[11px] text-gray-500">reste {fmt(o.remains)}</p> : null}</td><td className="text-right font-semibold">{fmt(o.priceXaf)} F</td><td className="text-right text-gray-600">{(o.costUsd / 100).toFixed(2)} $</td><td><Badge tone={statusTone(o.status)}>{o.status}</Badge></td><td className="text-gray-500">{fdate(o.createdAt)}</td></tr>)}{data && data.items.length === 0 && <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-500">Aucune commande.</td></tr>}</tbody>
        </table>
      </section>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
