"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Pager, Toast, api, fdate } from "@/components/Shell";

type C = { id: string; name: string; phone: string; countryCode: string; countryName: string; city: string | null; age: number | null; profession: string | null; gender: string | null; ownerId: string | null; createdAt: string };

export default function ContactsPage() {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: C[]; total: number; pages: number } | null>(null);
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => fetch(`/api/contacts?q=${encodeURIComponent(q)}&page=${page}`).then((r) => r.json()).then(setData), [q, page]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function importCsv() {
    const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows = lines.filter((l) => !/^nom[,;]/i.test(l)).map((l) => { const [name, phone, countryCode, countryName, city, age, profession, gender] = l.split(/[;,]/).map((x) => x?.trim().replace(/^"|"$/g, "")); return { name, phone, countryCode, countryName: countryName || countryCode, city, age: Number(age) || undefined, profession, gender }; });
    try { const r = await api<{ inserted: number }>("/api/contacts", { method: "POST", body: JSON.stringify({ rows }) }); setMsg({ ok: true, text: `${r.inserted} contact(s) importé(s).` }); setCsv(""); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  return (
    <>
      <section className="card px-6 py-6">
        <h3 className="text-[18px] font-bold text-ink">Importer des contacts (CSV)</h3>
        <p className="text-[13px] text-gray-500">Une ligne par contact : <code>Nom, Téléphone, CodePays, Pays, Ville, Âge, Profession, Sexe</code></p>
        <textarea className="input !h-32 mt-3 py-3 font-mono text-[13px]" placeholder={"Mariam Koné, +22376123456, ML, Mali, Bamako, 31, Commerçante, F"} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div className="mt-3"><Btn onClick={importCsv} disabled={!csv.trim()}>Importer</Btn></div>
        <Toast msg={msg} />
      </section>
      <div className="mt-5 flex items-center gap-3"><input className="input !h-12 text-[15px]" placeholder="Rechercher nom, téléphone, ville…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /><span className="shrink-0 text-[14px] text-gray-500">{data?.total ?? 0} contact(s)</span></div>
      <section className="card mt-3 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Nom</th><th>Téléphone</th><th>Pays</th><th>Ville</th><th>Profil</th><th>Ajouté</th><th></th></tr></thead>
          <tbody className="divide-y divide-gray-100">{data?.items.map((c) => <tr key={c.id}><td className="px-5 py-3 font-semibold text-ink">{c.name}{c.ownerId && <span className="ml-2 rounded bg-primary-soft px-1.5 text-[11px] text-primary">membre</span>}</td><td>{c.phone}</td><td>{c.countryName}</td><td>{c.city}</td><td className="text-gray-600">{[c.profession, c.age ? `${c.age} ans` : null, c.gender].filter(Boolean).join(" · ")}</td><td className="text-gray-500">{fdate(c.createdAt)}</td><td className="pr-4"><Btn small tone="red" onClick={() => api(`/api/contacts?id=${c.id}`, { method: "DELETE" }).then(load)}>Supprimer</Btn></td></tr>)}</tbody>
        </table>
      </section>
      <Pager page={page} pages={data?.pages ?? 1} onChange={setPage} />
    </>
  );
}
