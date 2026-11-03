"use client";

import { useEffect, useState } from "react";
import { Badge, Pager, Tabs, fdate, fmt, statusTone } from "@/components/Shell";

type T = { id: string; userName: string; type: string; amount: number; currency: string; status: string; label: string | null; reference: string; operator: string | null; createdAt: string };
const TYPES = ["all", "activation", "deposit", "withdrawal", "commission", "revenue", "ads", "transfer", "transfer_in", "transfer_out", "conversion", "purchase"];

export default function TransactionsPage() {
  const [type, setType] = useState("all"); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: T[]; total: number; pages: number } | null>(null);
  useEffect(() => { fetch(`/api/transactions?type=${type}&page=${page}`).then((r) => r.json()).then(setData); }, [type, page]);
  return (
    <>
      <Tabs value={type} onChange={(v) => { setType(v); setPage(1); }} items={TYPES.map((t) => ({ v: t, l: t === "all" ? "Toutes" : t }))} />
      <p className="mt-3 text-[14px] text-gray-500">{data?.total ?? 0} transaction(s)</p>
      <section className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Membre</th><th>Type</th><th>Libellé</th><th>Réf.</th><th className="text-right">Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{data?.items.map((t) => <tr key={t.id}><td className="px-5 py-3 font-semibold text-ink">{t.userName}</td><td>{t.type}</td><td className="max-w-[280px] truncate text-gray-600">{t.label}</td><td className="font-mono text-[12px]">{t.reference}</td><td className="text-right font-semibold">{t.currency === "USD" ? `${(t.amount / 100).toFixed(2)} $` : `${fmt(t.amount)} F`}</td><td><Badge tone={statusTone(t.status)}>{t.status}</Badge></td><td className="text-gray-500">{fdate(t.createdAt)}</td></tr>)}</tbody>
        </table>
      </section>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
