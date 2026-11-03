"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Btn, Tabs, Toast, api, fmt } from "@/components/Shell";

type I = { id: string; kind: string; title: string; description: string; category: string; price: number; promo: boolean; coverUrl: string | null; durationLabel: string | null; format: string | null; accessUrl: string | null; status: string; sellerName: string | null; sales: number };
const EMPTY = { kind: "formation", title: "", description: "", category: "", price: "0", promo: false, coverUrl: "", durationLabel: "", format: "", accessUrl: "", status: "published" };

export default function CatalogPage() {
  const [kind, setKind] = useState("all");
  const [items, setItems] = useState<I[]>([]);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>(EMPTY);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(() => fetch(`/api/catalog?kind=${kind}`).then((r) => r.json()).then(setItems), [kind]);
  useEffect(() => { load(); }, [load]);
  async function save() {
    setMsg(null);
    try { await api("/api/catalog", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price) || 0 }) }); setMsg({ ok: true, text: form.id ? "Élément mis à jour." : "Élément publié." }); setOpen(false); setForm(EMPTY); load(); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  }
  async function archive(id: string) { if (!confirm("Archiver cet élément ?")) return; await api(`/api/catalog?id=${id}`, { method: "DELETE" }); load(); }
  const edit = (i: I) => { setForm({ id: i.id, kind: i.kind, title: i.title, description: i.description, category: i.category, price: String(i.price), promo: i.promo, coverUrl: i.coverUrl || "", durationLabel: i.durationLabel || "", format: i.format || "", accessUrl: i.accessUrl || "", status: i.status }); setOpen(true); };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={kind} onChange={setKind} items={[{ v: "all", l: "Tout" }, { v: "formation", l: "Formations" }, { v: "ebook", l: "Ebooks" }, { v: "product", l: "Boutique" }]} />
        <Btn onClick={() => { setForm(EMPTY); setOpen(true); }}>+ Ajouter</Btn>
      </div>
      <Toast msg={msg} />
      {open && (
        <section className="card mt-4 px-6 py-6">
          <h3 className="text-[18px] font-bold text-ink">{form.id ? "Modifier" : "Nouvel élément"}</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select className="input !h-12 text-[15px]" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="formation">Formation</option><option value="ebook">Ebook</option><option value="product">Produit boutique</option></select>
            <input className="input !h-12 text-[15px]" placeholder="Catégorie" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input className="input !h-12 text-[15px] sm:col-span-2" placeholder="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="input !h-24 py-3 text-[15px] sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="input !h-12 text-[15px]" placeholder="Prix (F, 0 = gratuit)" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })} />
            <input className="input !h-12 text-[15px]" placeholder="Durée (ex. 2h30)" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} />
            <input className="input !h-12 text-[15px]" placeholder="Image (URL ou /images/…)" value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} />
            <input className="input !h-12 text-[15px]" placeholder="Lien d'accès (Drive, YouTube…)" value={form.accessUrl} onChange={(e) => setForm({ ...form, accessUrl: e.target.value })} />
            <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" className="h-5 w-5 accent-primary" checked={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.checked })} /> Badge PROMO</label>
            <select className="input !h-12 text-[15px]" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="published">Publié</option><option value="draft">Brouillon</option><option value="archived">Archivé</option></select>
          </div>
          <div className="mt-4 flex gap-2"><Btn onClick={save} disabled={!form.title || !form.category}>Enregistrer</Btn><Btn tone="ghost" onClick={() => setOpen(false)}>Annuler</Btn></div>
        </section>
      )}
      <section className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="bg-surface text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Titre</th><th>Type</th><th>Catégorie</th><th className="text-right">Prix</th><th className="text-right">Ventes</th><th>Vendeur</th><th>Statut</th><th></th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3"><div className="flex items-center gap-3">{i.coverUrl && <img src={i.coverUrl} alt="" className="h-10 w-14 rounded-lg object-cover" />}<span className="font-semibold text-ink">{i.title}{i.promo && <Badge tone="amber">PROMO</Badge>}</span></div></td>
                <td>{i.kind}</td><td>{i.category}</td><td className="text-right font-semibold">{i.price === 0 ? "Gratuit" : `${fmt(i.price)} F`}</td><td className="text-right">{i.sales}</td><td className="text-gray-500">{i.sellerName ?? "DBI"}</td>
                <td><Badge tone={i.status === "published" ? "green" : i.status === "draft" ? "amber" : "gray"}>{i.status}</Badge></td>
                <td className="pr-4"><div className="flex gap-2"><Btn small tone="ghost" onClick={() => edit(i)}>Modifier</Btn>{i.status !== "archived" && <Btn small tone="red" onClick={() => archive(i.id)}>Archiver</Btn>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
