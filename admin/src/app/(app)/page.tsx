"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, BadgeCheck, CreditCard, Megaphone, MessagesSquare, TrendingUp, Users, Wallet } from "lucide-react";
import { Badge, Kpi, fdate, fmt, statusTone } from "@/components/Shell";

type Ov = { members: number; active: number; pendingWithdrawals: number; pendingWithdrawalsAmount: number; pendingCampaigns: number; pendingDays: number; activationRevenue30d: number; deposits30d: number; unreadSupport: number; openSmm: number; recentUsers: { id: string; name: string; email: string; status: string; countryCode: string; createdAt: string }[]; recentTx: { id: string; type: string; amount: number; currency: string; status: string; label: string | null; userName: string; createdAt: string }[]; signups: { d: string; n: number; a: number }[] };

export default function Dashboard() {
  const [o, setO] = useState<Ov | null>(null);
  useEffect(() => { fetch("/api/overview").then((r) => r.json()).then(setO); }, []);
  if (!o) return <p className="text-gray-500">Chargement…</p>;
  const max = Math.max(1, ...o.signups.map((s) => s.n));
  return (
    <>
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2b43ea] via-[#2234c9] to-[#17207d] px-8 py-8 text-white shadow-xl">
        <img src="/images/wallet-hero.png" alt="" className="pointer-events-none absolute -right-6 top-6 w-56 opacity-90 mix-blend-screen" />
        <p className="text-[15px] font-medium text-white/80">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        <h2 className="mt-2 text-[34px] font-extrabold leading-tight">Tableau de bord DBI</h2>
        <p className="mt-2 max-w-md text-[17px] text-white/85">{o.active} membres actifs sur {o.members} · {o.pendingWithdrawals} retrait(s) à traiter · {o.pendingCampaigns + o.pendingDays} action(s) Ads en attente</p>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users />} label="Membres" value={fmt(o.members)} sub={`${fmt(o.active)} actifs`} />
        <Kpi icon={<BadgeCheck />} cls="bg-emerald-50 text-emerald-600" label="Activations 30j" value={`${fmt(o.activationRevenue30d)} F`} />
        <Kpi icon={<Wallet />} cls="bg-sky-50 text-sky-600" label="Dépôts 30j" value={`${fmt(o.deposits30d)} F`} />
        <Kpi icon={<ArrowDownToLine />} cls="bg-orange-50 text-orange-500" label="Retraits en attente" value={String(o.pendingWithdrawals)} sub={`${fmt(o.pendingWithdrawalsAmount)} F`} />
        <Link href="/ads"><Kpi icon={<Megaphone />} cls="bg-rose-50 text-rose-500" label="Ads à valider" value={String(o.pendingCampaigns)} sub={`${o.pendingDays} jour(s) à vérifier`} /></Link>
        <Link href="/support"><Kpi icon={<MessagesSquare />} cls="bg-cyan-50 text-cyan-600" label="Support non lu" value={String(o.unreadSupport)} /></Link>
        <Link href="/smm"><Kpi icon={<TrendingUp />} cls="bg-indigo-50 text-indigo-600" label="SMM en cours" value={String(o.openSmm)} /></Link>
        <Link href="/payments"><Kpi icon={<CreditCard />} cls="bg-purple-50 text-purple-600" label="Paiements" value="Voir" sub="AshTechPay" /></Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card px-6 py-6">
          <h3 className="text-[20px] font-bold text-ink">Inscriptions (14 jours)</h3>
          <div className="mt-5 flex h-40 items-end gap-2">
            {o.signups.length === 0 && <p className="text-[14px] text-gray-500">Aucune inscription récente.</p>}
            {o.signups.map((s) => (
              <div key={s.d} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-col-reverse" style={{ height: `${(s.n / max) * 130}px` }}>
                  <div className="w-full rounded-t-md bg-[#5865f2]" style={{ height: `${((s.n - s.a) / Math.max(1, s.n)) * 100}%` }} />
                  <div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${(s.a / Math.max(1, s.n)) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-500">{s.d}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex gap-4 text-[13px] text-gray-500"><span><span className="mr-1 inline-block h-3 w-3 rounded bg-emerald-500" />Actifs</span><span><span className="mr-1 inline-block h-3 w-3 rounded bg-[#5865f2]" />En attente</span></p>
        </section>
        <section className="card px-6 py-6">
          <div className="flex items-center justify-between"><h3 className="text-[20px] font-bold text-ink">Derniers membres</h3><Link href="/members" className="text-[14px] font-semibold text-primary">Voir tout</Link></div>
          <ul className="mt-4 divide-y divide-gray-100">
            {o.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-3">
                <Link href={`/members/${u.id}`} className="min-w-0"><p className="truncate text-[16px] font-semibold text-ink">{u.name}</p><p className="truncate text-[13px] text-gray-500">{u.email} · {u.countryCode}</p></Link>
                <Badge tone={statusTone(u.status)}>{u.status === "active" ? "Actif" : "En attente"}</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 px-6 py-6">
        <div className="flex items-center justify-between"><h3 className="text-[20px] font-bold text-ink">Dernières transactions</h3><Link href="/transactions" className="text-[14px] font-semibold text-primary">Voir tout</Link></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="py-2">Membre</th><th>Type</th><th>Libellé</th><th className="text-right">Montant</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {o.recentTx.map((t) => <tr key={t.id}><td className="py-3 font-semibold text-ink">{t.userName}</td><td>{t.type}</td><td className="max-w-[240px] truncate text-gray-600">{t.label}</td><td className="text-right font-semibold">{t.currency === "USD" ? `${(t.amount / 100).toFixed(2)} $` : `${fmt(t.amount)} F`}</td><td><Badge tone={statusTone(t.status)}>{t.status}</Badge></td><td className="text-gray-500">{fdate(t.createdAt)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
