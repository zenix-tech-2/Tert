"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, UserCheck } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";
import { englishCountryName } from "@/lib/countries";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

type Member = { name: string; matricule: string; countryCode: string; active: boolean };

export default function TransfertPage() {
  const { user, refresh } = useAppUser();
  const [cfg, setCfg] = useState({ feePct: 10, min: 0 });
  const [matricule, setMatricule] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [estimate, setEstimate] = useState<{ amount: number; fee: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ recipient: string; net: number; fee: number } | null>(null);

  useEffect(() => { fetch("/api/transfers").then((r) => r.json()).then((d) => setCfg({ feePct: d.feePct, min: d.min })); }, []);

  const value = Math.floor(Number(amount) || 0);

  async function search() {
    setError(null);
    setMember(null);
    if (!matricule.trim()) return setError("Entrez le matricule du destinataire.");
    setSearching(true);
    const r = await fetch(`/api/transfers/search?matricule=${encodeURIComponent(matricule.trim())}`);
    const d = await r.json();
    setSearching(false);
    if (!r.ok) return setError(d.error || "Membre introuvable.");
    setMember(d.member);
  }

  function doEstimate() {
    setError(null);
    if (value <= 0) return setError("Entrez un montant.");
    const fee = Math.ceil((value * cfg.feePct) / 100);
    setEstimate({ amount: value, fee, total: value + fee });
  }

  async function send() {
    setError(null);
    if (!member) return setError("Recherchez d'abord le destinataire.");
    if (value <= 0) return setError("Entrez un montant.");
    setBusy(true);
    const r = await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matricule: member.matricule, amount: value }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error || "Transfert impossible.");
    setDone({ recipient: d.recipient.name, net: d.net, fee: d.fee });
    setAmount("");
    setEstimate(null);
    setMember(null);
    setMatricule("");
    refresh();
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Solde actuel" value={`${fmt(user.balance)} XAF`} />
        <Stat label="Frais transfert" value={`${cfg.feePct}%`} />
        <Stat label="Minimum transfert" value={`${fmt(cfg.min)} XAF`} />
      </div>

      <section className="card mt-7 px-10 py-10">
        <h1 className="text-[36px] font-semibold text-ink">Transfert DBI</h1>
        <p className="mt-2 text-[21px] leading-snug text-gray-500">Envoyez de l&apos;argent a un autre membre avec son matricule DBI.</p>

        <input className="input mt-8 text-[21px] uppercase" placeholder="Matricule du destinataire" value={matricule} onChange={(e) => { setMatricule(e.target.value.toUpperCase()); setMember(null); }} />
        <button type="button" onClick={search} disabled={searching} className="btn-primary mt-4 !h-[88px] !text-[22px] !font-semibold">{searching ? <span className="spinner" /> : "Rechercher"}</button>

        {member && (
          <div className={"mt-5 flex items-center gap-4 rounded-2xl border px-5 py-4 " + (member.active ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50")}>
            <UserCheck className={"h-8 w-8 " + (member.active ? "text-emerald-600" : "text-amber-600")} />
            <div>
              <p className="text-[20px] font-bold text-ink">{member.name}</p>
              <p className="text-[15px] text-gray-600">{member.matricule} · {englishCountryName(member.countryCode)} {!member.active && "· compte non activé"}</p>
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-[1fr_auto] gap-4">
          <div>
            <label className="label font-medium" htmlFor="tf-amount">Montant du transfert</label>
            <input id="tf-amount" inputMode="numeric" className="input text-[21px]" placeholder="0" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setEstimate(null); }} />
          </div>
          <div className="w-44">
            <label className="label font-medium">Devise</label>
            <div className="input flex items-center justify-between bg-gray-50 text-[21px]">XAF <ChevronDown className="h-5 w-5" /></div>
          </div>
        </div>

        <button type="button" onClick={doEstimate} className="mt-5 flex h-[88px] w-full items-center justify-center rounded-2xl border border-gray-300 bg-white text-[22px] font-medium text-ink">Estimer</button>
        {estimate && (
          <div className="mt-4 rounded-2xl bg-primary-soft px-6 py-5 text-[18px] text-ink">
            <div className="flex justify-between"><span>Montant reçu par le destinataire</span><strong>{fmt(estimate.amount)} XAF</strong></div>
            <div className="mt-1 flex justify-between"><span>Frais ({cfg.feePct}%)</span><strong>{fmt(estimate.fee)} XAF</strong></div>
            <div className="mt-2 flex justify-between border-t border-primary/20 pt-2 text-[20px]"><span>Total débité</span><strong className="text-primary">{fmt(estimate.total)} XAF</strong></div>
          </div>
        )}

        {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">{error}</p>}
        {done && (
          <p className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[16px] font-medium text-emerald-700">
            <CheckCircle2 className="h-6 w-6" /> {fmt(done.net)} XAF envoyés à {done.recipient} (frais : {fmt(done.fee)} XAF).
          </p>
        )}

        <button type="button" onClick={send} disabled={busy || !member || value <= 0} className="btn-primary mt-5 !h-[88px] !text-[22px] !font-semibold">{busy ? <span className="spinner" /> : "Envoyer"}</button>
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
