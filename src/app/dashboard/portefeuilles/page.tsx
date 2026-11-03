"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Bitcoin, ChevronDown, RefreshCw, Wallet } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const usd = (cents: number) => (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Conversion = { id: string; label: string | null; createdAt: string; meta: { from?: number; fromCurrency?: string; to?: number; toCurrency?: string } };

export default function PortefeuillesPage() {
  const { user, refresh } = useAppUser();
  const [rate, setRate] = useState(600);
  const [items, setItems] = useState<Conversion[]>([]);
  const [direction, setDirection] = useState<"usd_to_xaf" | "xaf_to_usd">("usd_to_xaf");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => fetch("/api/wallet/convert").then((r) => r.json()).then((d) => { setRate(d.rate); setItems(d.items || []); }), []);
  useEffect(() => { load(); }, [load]);

  const value = Number(amount) || 0;
  const preview = direction === "usd_to_xaf" ? `${fmt(Math.floor(value * rate))} XAF` : `${(value / rate).toFixed(2)} USD`;

  async function submit() {
    setMsg(null);
    setBusy(true);
    const r = await fetch("/api/wallet/convert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ direction, amount: value }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error || "Conversion impossible." });
    setMsg({ ok: true, text: `Conversion effectuée : ${preview} crédités.` });
    setAmount("");
    await Promise.all([refresh(), load()]);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-bold leading-tight text-ink">Mes portefeuilles</h1>
          <p className="mt-1 text-[21px] text-gray-500">Vos soldes XAF et USD restent independants.</p>
        </div>
        <button type="button" aria-label="Actualiser" disabled={refreshing} onClick={async () => { setRefreshing(true); await Promise.all([refresh(), load()]); setRefreshing(false); }} className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-ink">
          <RefreshCw className={"h-8 w-8 " + (refreshing ? "animate-spin" : "")} />
        </button>
      </div>

      {/* Main wallet */}
      <section className="mt-8 rounded-[28px] bg-gradient-to-br from-[#1c2fcf] to-[#0e1a8a] px-10 py-10 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <p className="text-[19px] font-bold uppercase tracking-wide text-white/75">Portefeuille principal</p>
          <span className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-white/15"><Wallet className="h-10 w-10" /></span>
        </div>
        <p className="mt-2 text-[54px] font-extrabold leading-none">{fmt(user.balance)} XAF</p>
        <Link href="/dashboard/depot" className="mt-14 inline-flex h-[76px] items-center rounded-2xl bg-white/15 px-8 text-[22px] font-bold">Deposer</Link>
      </section>

      {/* USD wallet */}
      <section className="mt-8 rounded-[28px] bg-gradient-to-br from-[#0f8f5a] to-[#064b35] px-10 py-10 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <p className="text-[19px] font-bold uppercase tracking-wide text-white/75">Portefeuille USD</p>
          <span className="flex h-[84px] w-[84px] items-center justify-center rounded-2xl bg-white/15"><Bitcoin className="h-10 w-10" /></span>
        </div>
        <p className="mt-2 text-[54px] font-extrabold leading-none">{usd(user.balanceUsd)} USD</p>
        <p className="mt-4 text-[20px] text-white/80">Reserve aux operations crypto</p>
        <div className="mt-10 grid grid-cols-2 gap-4">
          <Link href="/dashboard/depot" className="flex h-[76px] items-center justify-center rounded-2xl bg-white/15 text-[20px] font-bold">Depot Crypto</Link>
          <Link href="/dashboard/retrait" className="flex h-[76px] items-center justify-center rounded-2xl bg-white/15 text-[20px] font-bold">Retrait Crypto</Link>
        </div>
      </section>

      {/* Convert */}
      <section className="card mt-8 px-10 py-10">
        <div className="flex items-start gap-6">
          <span className="flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><ArrowDownUp className="h-9 w-9" /></span>
          <div>
            <h2 className="text-[32px] font-bold leading-tight text-ink">Convertir entre mes portefeuilles</h2>
            <p className="mt-3 text-[21px] text-gray-500">1 USD = {rate.toFixed(4)} XAF - Aucun frais de conversion</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-2xl bg-gray-100 p-1.5">
          {(["usd_to_xaf", "xaf_to_usd"] as const).map((d) => (
            <button key={d} type="button" onClick={() => { setDirection(d); setMsg(null); }} className={"rounded-xl py-5 text-[20px] font-semibold transition " + (direction === d ? "bg-white text-primary shadow" : "text-gray-500")}>
              {d === "usd_to_xaf" ? "USD vers Principal" : "Principal vers USD"}
            </button>
          ))}
        </div>

        <p className="mt-8 text-[19px] font-bold uppercase tracking-wide text-gray-400">Source</p>
        <p className="mt-1 text-[26px] font-bold text-ink">{direction === "usd_to_xaf" ? `${usd(user.balanceUsd)} USD` : `${fmt(user.balance)} XAF`}</p>
        <p className="mt-6 text-[19px] font-bold uppercase tracking-wide text-gray-400">Destination</p>
        <p className="mt-1 text-[26px] font-bold text-ink">{direction === "usd_to_xaf" ? `${fmt(user.balance)} XAF` : `${usd(user.balanceUsd)} USD`}</p>

        <div className="mt-8 grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label className="label font-medium" htmlFor="cv-amount">Montant à convertir</label>
            <input id="cv-amount" inputMode="decimal" className="input text-[21px]" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} />
          </div>
          <div className="w-44">
            <label className="label font-medium">Devise</label>
            <div className="input flex items-center justify-between bg-gray-50 text-[21px]">{direction === "usd_to_xaf" ? "USD" : "XAF"} <ChevronDown className="h-5 w-5" /></div>
          </div>
        </div>
        {value > 0 && <p className="mt-3 text-[17px] text-gray-500">Vous recevrez <strong className="text-ink">{preview}</strong></p>}
        {msg && <p className={"mt-4 text-[16px] font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p>}

        <button type="button" disabled={busy || value <= 0} onClick={submit} className="btn-primary mt-8 !text-[22px]">
          {busy ? <span className="spinner" /> : <><ArrowDownUp className="h-7 w-7" /> Confirmer la conversion</>}
        </button>
      </section>

      {/* Recent */}
      <section className="card mt-8 px-10 py-10">
        <h2 className="text-[32px] font-bold text-ink">Conversions recentes</h2>
        {items.length === 0 ? (
          <p className="mt-6 text-[19px] text-gray-500">Aucune conversion pour le moment.</p>
        ) : (
          <ul className="mt-6 divide-y divide-gray-100">
            {items.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-5">
                <div>
                  <p className="text-[19px] font-semibold text-ink">{c.meta?.from} {c.meta?.fromCurrency} → {c.meta?.to} {c.meta?.toCurrency}</p>
                  <p className="text-[15px] text-gray-500">{new Date(c.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <span className="rounded-lg bg-emerald-50 px-3 py-1 text-[16px] font-semibold text-emerald-700">Terminé</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
