"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

type Sub = { id: string; amount: number; startsAt: string; expiresAt: string } | null;
type Product = { id: string; title: string; kind: string; price: number; category: string; status: string; sales: number; createdAt: string };
type Status = { subscription: Sub; products: Product[]; pricing: { publishPrice: number; editPrice: number; shopFee: number; subscription: number } };

const CATEGORIES = ["Développement Personnel", "Marketing", "E-commerce", "Design", "Contenu", "Intelligence Artificielle", "Crypto", "Business", "Autre"];

export default function VendeurPage() {
  const { refresh } = useAppUser();
  const [st, setSt] = useState<Status | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [f, setF] = useState({ kind: "product", title: "", description: "", category: CATEGORIES[0], price: "", promo: false, coverUrl: "", accessUrl: "", durationLabel: "" });

  const load = useCallback(() => fetch("/api/vendor").then((r) => r.json()).then(setSt), []);
  useEffect(() => { load(); }, [load]);

  async function subscribe() {
    setMsg(null);
    setBusy(true);
    const r = await fetch("/api/vendor/subscribe", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error });
    setMsg({ ok: true, text: "Souscription vendeur activée pour 1 an." });
    await Promise.all([load(), refresh()]);
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const r = await fetch("/api/vendor/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, price: Number(f.price) || 0 }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error });
    setMsg({ ok: true, text: "Produit publié dans la boutique." });
    setAdding(false);
    setF({ kind: "product", title: "", description: "", category: CATEGORIES[0], price: "", promo: false, coverUrl: "", accessUrl: "", durationLabel: "" });
    await Promise.all([load(), refresh()]);
  }

  const p = st?.pricing;
  const sub = st?.subscription;

  return (
    <>
      <section className="card px-8 py-8">
        <h1 className="text-[34px] font-semibold text-ink">Espace vendeur</h1>
        <p className="mt-1 text-[21px] leading-snug text-gray-500">Publiez vos formations digitales et suivez vos ventes.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/dashboard/boutique" className="flex h-[88px] items-center rounded-2xl border border-gray-300 bg-white px-8 text-[22px] font-medium text-ink">Boutique</Link>
          <button type="button" onClick={subscribe} disabled={busy || !!sub} className="flex h-[88px] items-center rounded-2xl bg-primary px-8 text-[22px] font-semibold text-white disabled:opacity-60">Souscription annuelle</button>
          <button type="button" onClick={() => setAdding((a) => !a)} className="flex h-[88px] items-center rounded-2xl bg-primary px-8 text-[22px] font-semibold text-white">Ajouter un produit</button>
        </div>
        {msg && <p className={"mt-5 rounded-2xl px-4 py-3 text-[16px] font-medium " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p>}
      </section>

      {adding && (
        <form onSubmit={publish} className="card mt-6 px-8 py-8">
          <h2 className="text-[28px] font-bold text-ink">Nouveau produit</h2>
          {!sub && <p className="mt-2 rounded-2xl bg-amber-50 px-4 py-3 text-[16px] font-medium text-amber-800">Une souscription vendeur active est requise pour publier.</p>}
          <label className="label mt-5">Type</label>
          <Sel value={f.kind} onChange={(v) => setF({ ...f, kind: v })}>
            <option value="product">Produit digital</option>
            <option value="formation">Formation</option>
            <option value="ebook">Ebook</option>
          </Sel>
          <label className="label mt-5">Titre</label>
          <input className="input" required minLength={3} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <label className="label mt-5">Description</label>
          <textarea className="input !h-32 py-4" required minLength={10} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <label className="label">Catégorie</label>
              <Sel value={f.category} onChange={(v) => setF({ ...f, category: v })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Sel>
            </div>
            <div>
              <label className="label">Prix (F)</label>
              <input className="input" inputMode="numeric" placeholder="0 = gratuit" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value.replace(/\D/g, "") })} />
            </div>
          </div>
          {f.kind === "formation" && (
            <>
              <label className="label mt-5">Durée (ex. 2h30)</label>
              <input className="input" value={f.durationLabel} onChange={(e) => setF({ ...f, durationLabel: e.target.value })} />
            </>
          )}
          <label className="label mt-5">Image de couverture (URL)</label>
          <input className="input" type="url" placeholder="https://…" value={f.coverUrl} onChange={(e) => setF({ ...f, coverUrl: e.target.value })} />
          <label className="label mt-5">Lien d&apos;accès (Drive, YouTube, Telegram…)</label>
          <input className="input" type="url" placeholder="https://…" value={f.accessUrl} onChange={(e) => setF({ ...f, accessUrl: e.target.value })} />
          <label className="mt-5 flex items-center gap-3 text-[18px] text-ink">
            <input type="checkbox" className="h-6 w-6 accent-primary" checked={f.promo} onChange={(e) => setF({ ...f, promo: e.target.checked })} /> Afficher le badge PROMO
          </label>
          <button type="submit" disabled={busy || !sub} className="btn-primary mt-6">{busy ? <span className="spinner" /> : `Publier${p?.publishPrice ? ` · ${fmt(p.publishPrice)} F` : ""}`}</button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Stat label="Prix publication" value={fmt(p?.publishPrice ?? 0)} />
        <Stat label="Prix modification" value={fmt(p?.editPrice ?? 990)} />
        <Stat label="Frais boutique" value={fmt(p?.shopFee ?? 990)} />
        <Stat label="Souscription" value={fmt(p?.subscription ?? 10000)} />
        <Stat label="Produits" value={String(st?.products.length ?? 0)} />
        <Stat label="Ventes" value={String(st?.products.reduce((a, x) => a + x.sales, 0) ?? 0)} />
      </div>

      <section className="card mt-6 px-8 py-8">
        <h2 className="text-[30px] font-semibold text-ink">Souscription vendeur</h2>
        <p className="mt-1 text-[21px] text-gray-500">Etat de votre abonnement boutique digitale.</p>
        <div className={"mt-5 rounded-full px-6 py-3 text-center text-[19px] font-medium " + (sub ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700")}>
          {sub ? `Active jusqu'au ${new Date(sub.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "Aucune souscription"}
        </div>
        {!sub && <p className="mt-4 text-center text-[17px] text-gray-500">Aucune souscription active. Souscrivez pour {fmt(p?.subscription ?? 10000)} F / an et publiez vos produits.</p>}
      </section>

      <section className="card mt-6 px-8 py-8">
        <h2 className="text-[30px] font-semibold text-ink">Mes produits</h2>
        {st && st.products.length === 0 ? (
          <p className="mt-4 text-[18px] text-gray-500">Vous n&apos;avez pas encore publié de produit.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {st?.products.map((pr) => (
              <li key={pr.id} className="flex items-center justify-between py-4">
                <div className="min-w-0">
                  <p className="truncate text-[19px] font-semibold text-ink">{pr.title}</p>
                  <p className="text-[15px] text-gray-500">{pr.category} · {pr.price === 0 ? "Gratuit" : `${fmt(pr.price)} F`} · {pr.sales} vente(s)</p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[15px] font-semibold capitalize text-emerald-700">{pr.status === "published" ? "Publié" : pr.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-6 py-7">
      <p className="text-[19px] text-gray-500">{label}</p>
      <p className="mt-2 text-[26px] font-semibold text-ink">{value}</p>
    </div>
  );
}

function Sel({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-12" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" />
    </div>
  );
}
