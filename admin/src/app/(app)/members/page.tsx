"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge, Pager, Tabs, fdate, fmt, statusTone } from "@/components/Shell";

type M = { id: string; name: string; email: string; whatsapp: string; countryCode: string; status: string; matricule: string | null; referralCode: string; balance: number; gains: number; createdAt: string };

export default function MembersPage() {
  const [q, setQ] = useState(""); const [status, setStatus] = useState("all"); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: M[]; total: number; pages: number } | null>(null);
  useEffect(() => { const t = setTimeout(() => fetch(`/api/members?q=${encodeURIComponent(q)}&status=${status}&page=${page}`).then((r) => r.json()).then(setData), 250); return () => clearTimeout(t); }, [q, status, page]);
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input className="input !h-12 pl-12 text-[15px]" placeholder="Nom, email, WhatsApp, matricule, code…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ v: "all", l: "Tous" }, { v: "active", l: "Actifs" }, { v: "pending", l: "En attente" }]} />
      </div>
      <p className="mt-3 text-[14px] text-gray-500">{data?.total ?? 0} membre(s)</p>
      <section className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Membre</th><th>Matricule</th><th>Pays</th><th className="text-right">Solde</th><th className="text-right">Gains</th><th>Statut</th><th>Inscrit</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items.map((m) => (
              <tr key={m.id} className="hover:bg-surface">
                <td className="px-5 py-3"><Link href={`/members/${m.id}`} className="font-semibold text-ink hover:text-primary">{m.name}</Link><p className="text-[12px] text-gray-500">{m.email} · {m.whatsapp}</p></td>
                <td className="font-mono text-[12px]">{m.matricule}</td><td>{m.countryCode}</td>
                <td className="text-right font-semibold">{fmt(m.balance)} F</td><td className="text-right text-emerald-700">{fmt(m.gains)} F</td>
                <td><Badge tone={statusTone(m.status)}>{m.status === "active" ? "Actif" : "En attente"}</Badge></td><td className="text-gray-500">{fdate(m.createdAt)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-500">Aucun membre.</td></tr>}
          </tbody>
        </table>
      </section>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
