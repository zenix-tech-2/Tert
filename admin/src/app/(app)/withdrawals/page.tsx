"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn, Pager, Tabs, Toast, api, fdate, fmt, statusTone } from "@/components/Shell";

type W = { id: string; userId: string; userName: string; userEmail: string; userWhatsapp: string; userBalance: number; amount: number; currency: string; status: string; operator: string | null; destination: string | null; reference: string; createdAt: string; meta: Record<string, unknown> };

export default function WithdrawalsPage() {
  const [status, setStatus] = useState("pending"); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: W[]; total: number; pages: number } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => fetch(`/api/withdrawals?status=${status}&page=${page}`).then((r) => r.json()).then(setData), [status, page]);
  useEffect(() => { load(); }, [load]);
  async function decide(id: string, decision: string) {
    const note = decision === "rejected" ? prompt("Motif du rejet (le membre est remboursé) :") ?? "" : "";
    if (decision === "rejected" && note === null) return;
    setMsg(null);
    try { await api("/api/withdrawals", { method: "POST", body: JSON.stringify({ id, decision, note }) }); setMsg({ ok: true, text: decision === "rejected" ? "Retrait rejeté et remboursé." : decision === "approved" ? "Retrait approuvé." : "Retrait marqué comme payé." }); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  return (
    <>
      <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ v: "pending", l: "En attente" }, { v: "approved", l: "Approuvés" }, { v: "completed", l: "Payés" }, { v: "rejected", l: "Rejetés" }, { v: "all", l: "Tous" }]} />
      <Toast msg={msg} />
      <p className="mt-3 text-[14px] text-gray-500">{data?.total ?? 0} retrait(s)</p>
      <div className="mt-3 space-y-3">
        {data?.items.map((w) => (
          <article key={w.id} className="card px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><Link href={`/members/${w.userId}`} className="text-[17px] font-bold text-ink hover:text-primary">{w.userName}</Link><p className="text-[13px] text-gray-500">{w.userEmail} · {w.userWhatsapp} · solde restant {fmt(w.userBalance)} F</p></div>
              <Badge tone={statusTone(w.status)}>{w.status}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
              <div><p className="text-[11px] uppercase text-gray-500">Montant</p><p className="text-[18px] font-extrabold text-ink">{w.currency === "USD" ? `${(w.amount / 100).toFixed(2)} USD` : `${fmt(w.amount)} F`}</p></div>
              <div><p className="text-[11px] uppercase text-gray-500">Opérateur / réseau</p><p className="font-semibold">{w.operator}</p></div>
              <div className="col-span-2"><p className="text-[11px] uppercase text-gray-500">Destination</p><p className="break-all font-mono text-[13px]">{w.destination}</p></div>
            </div>
            <p className="mt-2 text-[12px] text-gray-500">{w.reference} · {fdate(w.createdAt)}{w.currency === "USD" && w.meta?.xafEquivalent ? ` · ≈ ${fmt(Number(w.meta.xafEquivalent))} F débités` : ""}{w.meta?.note ? ` · note : ${String(w.meta.note)}` : ""}</p>
            {!["completed", "rejected"].includes(w.status) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {w.status === "pending" && <Btn small onClick={() => decide(w.id, "approved")}>Approuver</Btn>}
                <Btn small tone="green" onClick={() => decide(w.id, "completed")}>Marquer payé</Btn>
                <Btn small tone="red" onClick={() => decide(w.id, "rejected")}>Rejeter & rembourser</Btn>
              </div>
            )}
          </article>
        ))}
        {data && data.items.length === 0 && <p className="card px-5 py-10 text-center text-gray-500">Aucun retrait.</p>}
      </div>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
