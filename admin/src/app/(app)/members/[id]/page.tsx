"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Btn, Kpi, Toast, api, fdate, fmt, statusTone } from "@/components/Shell";

type Detail = { user: { id: string; name: string; email: string; whatsapp: string; countryCode: string; status: string; role: string; matricule: string | null; referralCode: string; referredBy: string | null; balance: number; gains: number; balanceUsd: number; feuilles: number; totalWithdrawn: number; createdAt: string; activatedAt: string | null }; transactions: { id: string; type: string; amount: number; currency: string; status: string; label: string | null; reference: string; createdAt: string }[]; payments: { id: string; purpose: string; method: string; amount: number; currency: string; status: string; operator: string | null; createdAt: string }[]; accounts: { id: string; operator: string; phone: string; isDefault: boolean }[]; referrals: number };

export default function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adj, setAdj] = useState({ field: "balance", delta: "", note: "" });
  const [pwd, setPwd] = useState("");
  const load = useCallback(() => fetch(`/api/members?id=${id}`).then((r) => r.json()).then(setD), [id]);
  useEffect(() => { load(); }, [load]);
  async function act(body: Record<string, unknown>, ok: string) {
    setMsg(null);
    try { await api("/api/members", { method: "POST", body: JSON.stringify({ id, ...body }) }); setMsg({ ok: true, text: ok }); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  if (!d) return <p className="text-gray-500">Chargement…</p>;
  const u = d.user;
  return (
    <>
      <Link href="/members" className="flex items-center gap-2 text-[15px] text-gray-600"><ArrowLeft className="h-5 w-5" /> Membres</Link>
      <section className="card mt-4 px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-[28px] font-bold text-ink">{u.name}</h2><p className="text-[15px] text-gray-500">{u.email} · {u.whatsapp} · {u.countryCode}</p><p className="mt-1 font-mono text-[13px] text-gray-500">{u.matricule} · code {u.referralCode}{u.referredBy ? ` · parrainé par ${u.referredBy}` : ""}</p><p className="text-[13px] text-gray-500">Inscrit le {fdate(u.createdAt)}{u.activatedAt ? ` · activé le ${fdate(u.activatedAt)}` : ""} · {d.referrals} filleul(s)</p></div>
          <div className="flex flex-wrap gap-2"><Badge tone={statusTone(u.status)}>{u.status === "active" ? "Actif" : "En attente"}</Badge>{u.role === "admin" && <Badge tone="purple">Admin</Badge>}</div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {u.status !== "active" && <Btn tone="green" onClick={() => act({ action: "activate" }, "Compte activé (commission parrain versée).")}>Activer le compte</Btn>}
          <Btn tone="ghost" onClick={() => act({ action: "role", role: u.role === "admin" ? "member" : "admin" }, "Rôle mis à jour.")}>{u.role === "admin" ? "Retirer admin" : "Promouvoir admin"}</Btn>
        </div>
        <Toast msg={msg} />
      </section>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Solde" value={`${fmt(u.balance)} F`} /><Kpi label="Gains" value={`${fmt(u.gains)} F`} cls="bg-emerald-50 text-emerald-600" /><Kpi label="USD" value={`${(u.balanceUsd / 100).toFixed(2)} $`} /><Kpi label="Feuilles" value={String(u.feuilles)} /><Kpi label="Retiré" value={`${fmt(u.totalWithdrawn)} F`} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card px-6 py-6">
          <h3 className="text-[18px] font-bold text-ink">Ajuster un solde</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <select className="input !h-12 text-[15px]" value={adj.field} onChange={(e) => setAdj({ ...adj, field: e.target.value })}><option value="balance">Solde principal (F)</option><option value="gains">Gains (F)</option><option value="balanceUsd">USD (cents)</option><option value="feuilles">Feuilles</option></select>
            <input className="input !h-12 text-[15px]" placeholder="+5000 ou -2000" value={adj.delta} onChange={(e) => setAdj({ ...adj, delta: e.target.value.replace(/[^\d-]/g, "") })} />
            <input className="input !h-12 col-span-2 text-[15px]" placeholder="Note (visible dans l'historique)" value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} />
          </div>
          <Btn onClick={() => act({ action: "adjust", field: adj.field, delta: Number(adj.delta), note: adj.note }, "Solde ajusté.")} disabled={!adj.delta}>Appliquer</Btn>
        </section>
        <section className="card px-6 py-6">
          <h3 className="text-[18px] font-bold text-ink">Réinitialiser le mot de passe</h3>
          <input className="input !h-12 mt-3 text-[15px]" placeholder="Nouveau mot de passe (6+)" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <div className="mt-3"><Btn tone="ghost" disabled={pwd.length < 6} onClick={() => { act({ action: "password", password: pwd }, "Mot de passe réinitialisé."); setPwd(""); }}>Réinitialiser</Btn></div>
          <h3 className="mt-6 text-[18px] font-bold text-ink">Comptes de retrait</h3>
          <ul className="mt-2 text-[14px] text-gray-700">{d.accounts.map((a) => <li key={a.id}>{a.operator} · {a.phone}{a.isDefault ? " (défaut)" : ""}</li>)}{d.accounts.length === 0 && <li className="text-gray-500">Aucun.</li>}</ul>
        </section>
      </div>

      <section className="card mt-5 overflow-x-auto">
        <h3 className="px-6 pt-5 text-[18px] font-bold text-ink">Transactions</h3>
        <table className="mt-3 w-full min-w-[640px] text-left text-[14px]"><thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-6 py-2">Type</th><th>Libellé</th><th>Réf.</th><th className="text-right">Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{d.transactions.map((t) => <tr key={t.id}><td className="px-6 py-2">{t.type}</td><td className="max-w-[260px] truncate text-gray-600">{t.label}</td><td className="font-mono text-[12px]">{t.reference}</td><td className="text-right font-semibold">{t.currency === "USD" ? `${(t.amount / 100).toFixed(2)} $` : `${fmt(t.amount)} F`}</td><td><Badge tone={statusTone(t.status)}>{t.status}</Badge></td><td className="text-gray-500">{fdate(t.createdAt)}</td></tr>)}</tbody></table>
      </section>
      <section className="card mt-5 overflow-x-auto">
        <h3 className="px-6 pt-5 text-[18px] font-bold text-ink">Paiements AshTechPay</h3>
        <table className="mt-3 w-full min-w-[560px] text-left text-[14px]"><thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-6 py-2">Objet</th><th>Méthode</th><th className="text-right">Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{d.payments.map((p) => <tr key={p.id}><td className="px-6 py-2">{p.purpose}</td><td>{p.operator ?? p.method}</td><td className="text-right font-semibold">{fmt(p.amount)} {p.currency}</td><td><Badge tone={statusTone(p.status)}>{p.status}</Badge></td><td className="text-gray-500">{fdate(p.createdAt)}</td></tr>)}{d.payments.length === 0 && <tr><td colSpan={5} className="px-6 py-6 text-gray-500">Aucun paiement.</td></tr>}</tbody></table>
      </section>
    </>
  );
}
