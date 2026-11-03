"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn, Pager, Tabs, Toast, api, fdate, fmt, statusTone } from "@/components/Shell";

type P = { id: string; userId: string; userName: string; userEmail: string; purpose: string; method: string; amount: number; currency: string; creditAmount: number; operator: string | null; phone: string | null; status: string; reference: string; providerId: string | null; createdAt: string };

export default function PaymentsPage() {
  const [status, setStatus] = useState("all"); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: P[]; total: number; pages: number } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => fetch(`/api/payments?status=${status}&page=${page}`).then((r) => r.json()).then(setData), [status, page]);
  useEffect(() => { load(); }, [load]);
  async function confirm(id: string) {
    if (!window.confirm("Confirmer manuellement ce paiement ? (activation du compte ou crédit du dépôt)")) return;
    try { await api("/api/payments", { method: "POST", body: JSON.stringify({ id }) }); setMsg({ ok: true, text: "Paiement confirmé." }); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  return (
    <>
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ v: "all", l: "Tous" }, { v: "pending", l: "En attente" }, { v: "success", l: "Réussis" }, { v: "failed", l: "Échoués" }, { v: "expired", l: "Expirés" }]} />
      <Toast msg={msg} />
      <section className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Membre</th><th>Objet</th><th>Méthode</th><th className="text-right">Montant</th><th>Référence</th><th>Statut</th><th>Date</th><th></th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items.map((p) => (
              <tr key={p.id}>
                <td className="px-5 py-3"><Link href={`/members/${p.userId}`} className="font-semibold text-ink hover:text-primary">{p.userName}</Link><p className="text-[12px] text-gray-500">{p.userEmail}</p></td>
                <td>{p.purpose === "deposit" ? `Dépôt (+${fmt(p.creditAmount)} F)` : "Activation"}</td><td>{p.operator ?? p.method}{p.phone ? <p className="text-[12px] text-gray-500">+{p.phone}</p> : null}</td>
                <td className="text-right font-semibold">{fmt(p.amount)} {p.currency}</td><td className="font-mono text-[12px]">{p.reference}{p.providerId ? <p className="text-gray-500">{p.providerId}</p> : null}</td>
                <td><Badge tone={statusTone(p.status)}>{p.status}</Badge></td><td className="text-gray-500">{fdate(p.createdAt)}</td>
                <td className="pr-4">{p.status !== "success" && <Btn small tone="green" onClick={() => confirm(p.id)}>Confirmer</Btn>}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-500">Aucun paiement.</td></tr>}
          </tbody>
        </table>
      </section>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
