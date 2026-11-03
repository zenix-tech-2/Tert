"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import { MethodCardsSmall, type Method } from "@/components/app/MethodCards";
import { useAppUser } from "@/components/app/AppShell";
import { OperatorBadge } from "@/components/BrandIcons";
import { DIAL_BY_CODE, englishCountryName } from "@/lib/countries";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

type Country = { code: string; name: string; currency: string; operators: string[] };
type Asset = { code: string; name: string; network: string };
type Account = { id: string; operator: string; countryCode: string; phone: string; isDefault: boolean };
type Withdrawal = { id: string; amount: number; currency: string; status: string; operator: string | null; reference: string; createdAt: string };
type Info = { items: Withdrawal[]; balance: number; balanceUsd: number; min: number; max: number; minUsd: number; maxUsd: number };

const STATUS_FR: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-50 text-amber-700" },
  approved: { label: "Approuvé", cls: "bg-sky-50 text-sky-700" },
  completed: { label: "Terminé", cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Échoué", cls: "bg-red-50 text-red-700" },
  rejected: { label: "Rejeté", cls: "bg-red-50 text-red-700" },
};

export default function RetraitPage() {
  const { user, refresh } = useAppUser();
  const [method, setMethod] = useState<Method>("mobile_money");
  const [info, setInfo] = useState<Info | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // mobile money form
  const [countryCode, setCountryCode] = useState(user.countryCode);
  const [operator, setOperator] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  // crypto form
  const [amountUsd, setAmountUsd] = useState("");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = () =>
    fetch("/api/withdrawals")
      .then((r) => r.json())
      .then(setInfo);

  useEffect(() => {
    load();
    fetch("/api/payments/catalog")
      .then((r) => r.json())
      .then((d) => {
        setCountries(d.countries || []);
        setAssets(d.assets || []);
        setNetwork(d.assets?.[0]?.code || "USDT.TRC20");
        if (!d.countries?.some((c: Country) => c.code === user.countryCode)) setCountryCode(d.countries?.[0]?.code || "");
      });
    fetch("/api/withdrawal-accounts")
      .then((r) => r.json())
      .then((d) => {
        setAccounts(d.accounts || []);
        const def = (d.accounts || []).find((a: Account) => a.isDefault);
        if (def) {
          setPhone(def.phone);
          setOperator(def.operator);
          setCountryCode(def.countryCode);
        }
      });
  }, [user.countryCode]);

  const country = useMemo(() => countries.find((c) => c.code === countryCode), [countries, countryCode]);
  useEffect(() => {
    if (country && !country.operators.includes(operator)) setOperator(country.operators[0] || "");
  }, [country, operator]);

  async function submit() {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const body =
        method === "mobile_money"
          ? { method, amount: Number(amount), operator, phone: phone.replace(/\D/g, ""), countryCode }
          : { method, amountUsd: Number(amountUsd), network, address };
      const r = await fetch("/api/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) return setError(d.error || "Retrait impossible.");
      setSuccess(
        method === "crypto"
          ? "Demande de retrait crypto envoyée. Un administrateur doit l'approuver avant transmission au réseau."
          : "Demande de retrait envoyée. Vous recevrez les fonds après validation.",
      );
      setAmount("");
      setAmountUsd("");
      setAddress("");
      await Promise.all([load(), refresh()]);
    } finally {
      setBusy(false);
    }
  }

  const dial = DIAL_BY_CODE[countryCode] || "";

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Solde actuel" value={`${fmt(user.balance)} F`} />
        <Stat label="Minimum retrait" value={`${fmt(info?.min ?? 1800)} F`} />
        <Stat label="Maximum retrait" value={`${fmt(user.balance)} F`} />
      </div>

      {/* Method */}
      <section className="card mt-7 px-7 py-8">
        <h2 className="text-[32px] font-bold text-ink">Retrait</h2>
        <p className="mt-1 text-[21px] text-gray-500">Choisissez votre methode de retrait.</p>
        <div className="mt-6">
          <MethodCardsSmall selected={method} onSelect={setMethod} />
        </div>
      </section>

      {/* Form */}
      {method === "mobile_money" ? (
        <section className="card mt-7 px-7 py-8">
          <h2 className="text-[28px] font-bold text-ink">Retrait Mobile Money</h2>
          <p className="mt-1 text-[19px] text-gray-500">Les fonds sont envoyés sur votre numéro Mobile Money après validation.</p>

          {accounts.length > 0 && (
            <div className="mt-6">
              <p className="label">Compte de retrait</p>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setPhone(a.phone);
                      setOperator(a.operator);
                      setCountryCode(a.countryCode);
                    }}
                    className={"rounded-full border px-4 py-2 text-[16px] font-semibold " + (phone === a.phone ? "border-primary bg-primary-soft text-primary" : "border-gray-200 text-gray-700")}
                  >
                    {a.operator} · {a.phone}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="label mt-6" htmlFor="wd-amount">
            Montant du retrait (F)
          </label>
          <input id="wd-amount" inputMode="numeric" className="input text-[21px]" placeholder={String(info?.min ?? 1800)} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
          <p className="mt-2 text-[16px] text-gray-500">
            Min. {fmt(info?.min ?? 1800)} F · Max. {fmt(user.balance)} F
          </p>

          <label className="label mt-6" htmlFor="wd-country">
            Pays
          </label>
          <div className="relative">
            <select id="wd-country" className="input appearance-none pr-12 text-[21px]" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {englishCountryName(c.code, c.name)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink" />
          </div>

          <label className="label mt-6" htmlFor="wd-phone">
            Numéro de retrait
          </label>
          <input id="wd-phone" type="tel" className="input text-[21px]" placeholder={`${dial} 6XX XXX XXX`} value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))} />

          <p className="label mt-6">Opérateur Mobile Money</p>
          <div className="grid grid-cols-3 gap-4">
            {country?.operators.map((op) => {
              const active = op === operator;
              return (
                <button key={op} type="button" onClick={() => setOperator(op)} className={"relative flex flex-col items-center gap-2 rounded-2xl border-2 px-2 pb-4 pt-5 transition " + (active ? "border-primary bg-primary-soft" : "border-gray-200 bg-gray-50")}>
                  {active && (
                    <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                  <OperatorBadge name={op} className="h-16 w-16" />
                  <span className="w-full truncate text-center text-[15px] font-semibold text-ink">{op}</span>
                </button>
              );
            })}
          </div>

          <Feedback error={error} success={success} />
          <button type="button" className="btn-primary mt-7" disabled={busy || !amount || !phone || !operator} onClick={submit}>
            {busy ? <span className="spinner" /> : "Demander le retrait"}
          </button>
        </section>
      ) : (
        <section className="card mt-7 px-7 py-8">
          <h2 className="text-[28px] font-bold text-ink">Retrait en cryptomonnaie</h2>
          <p className="mt-1 text-[21px] leading-snug text-gray-500">Un administrateur doit approuver votre demande avant sa transmission au réseau crypto.</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface px-5 py-5">
              <p className="text-[15px] font-bold uppercase tracking-wide text-gray-500">Solde principal</p>
              <p className="mt-1 text-[22px] font-bold text-ink">{fmt(user.balance)} XAF</p>
            </div>
            <div className="rounded-2xl bg-brand-green-soft px-5 py-5">
              <p className="text-[15px] font-bold uppercase tracking-wide text-brand-green">Solde USD</p>
              <p className="mt-1 text-[22px] font-bold text-ink">{(user.balanceUsd / 100).toFixed(user.balanceUsd % 100 ? 2 : 0)} USD</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto] gap-4">
            <div>
              <label className="label" htmlFor="cr-amount">
                Montant du retrait crypto
              </label>
              <input id="cr-amount" inputMode="decimal" className="input text-[21px]" placeholder="10.00" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value.replace(/[^\d.]/g, ""))} />
            </div>
            <div className="w-40">
              <label className="label">Devise</label>
              <div className="input flex items-center justify-between bg-gray-50 text-[21px]">
                USD <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
          <p className="mt-2 text-[16px] text-gray-500">
            Min. {info?.minUsd ?? 10} · Max. {info?.maxUsd ?? "–"} USD
          </p>

          <label className="label mt-6" htmlFor="cr-net">
            Réseau USDT
          </label>
          <div className="relative">
            <select id="cr-net" className="input appearance-none pr-12 text-[21px]" value={network} onChange={(e) => setNetwork(e.target.value)}>
              {(assets.length ? assets : [{ code: "USDT.TRC20", name: "USDT", network: "TRC20" }]).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink" />
          </div>

          <label className="label mt-6" htmlFor="cr-addr">
            Adresse du portefeuille
          </label>
          <input id="cr-addr" className="input text-[19px]" placeholder="Adresse compatible avec le réseau sélectionné" value={address} onChange={(e) => setAddress(e.target.value.trim())} />

          <div className="mt-6 flex gap-4 rounded-2xl border border-amber-300 bg-amber-50 px-6 py-6 text-[20px] leading-snug text-amber-900">
            <AlertTriangle className="mt-1 h-7 w-7 shrink-0" />
            <p>
              Vérifiez que l&apos;adresse accepte exactement <strong>{network}</strong>. Une adresse incompatible peut entraîner la perte définitive des fonds.
            </p>
          </div>

          <Feedback error={error} success={success} />
          <button type="button" className="btn-primary mt-7" disabled={busy || !amountUsd || !address} onClick={submit}>
            {busy ? <span className="spinner" /> : "Demander le retrait crypto"}
          </button>
        </section>
      )}

      {/* History */}
      <section className="card mt-7 overflow-hidden">
        <h2 className="px-7 pt-8 pb-5 text-[30px] font-bold text-ink">Historique des retraits</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left">
            <thead className="border-y border-gray-200 bg-white text-[18px] font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-5">Référence</th>
                <th className="px-6 py-5">Montant</th>
                <th className="px-6 py-5">Opérateur</th>
                <th className="px-6 py-5">Statut</th>
              </tr>
            </thead>
            <tbody className="text-[20px]">
              {info && info.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Aucun retrait pour le moment.
                  </td>
                </tr>
              )}
              {info?.items.map((w) => {
                const st = STATUS_FR[w.status] ?? { label: w.status, cls: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={w.id} className="border-b border-gray-100">
                    <td className="px-6 py-6 font-mono text-[16px] text-gray-600">{w.reference}</td>
                    <td className="px-6 py-6 text-ink">{w.currency === "USD" ? `${(w.amount / 100).toFixed(2)} $` : `${fmt(w.amount)} F`}</td>
                    <td className="px-6 py-6 text-ink">{w.operator ?? "—"}</td>
                    <td className="px-6 py-6">
                      <span className={"rounded-lg px-3 py-1.5 text-[18px] font-semibold " + st.cls}>{st.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-5 py-6">
      <p className="truncate text-[18px] text-gray-500">{label}</p>
      <p className="mt-2 text-[26px] font-bold text-ink">{value}</p>
    </div>
  );
}

function Feedback({ error, success }: { error: string | null; success: string | null }) {
  if (error) return <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">{error}</p>;
  if (success) return <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[16px] font-medium text-emerald-700">{success}</p>;
  return null;
}
