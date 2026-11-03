"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ChevronRight, Copy, ExternalLink, Smartphone, XCircle } from "lucide-react";
import { ActivationHeader, Stepper } from "./ActivationHeader";
import { OperatorBadge } from "./BrandIcons";
import { DIAL_BY_CODE, englishCountryName } from "@/lib/countries";

type Method = "mobile_money" | "crypto";
type Country = { code: string; name: string; currency: string; operators: string[]; price: number };
type Asset = { code: string; name: string; network: string };
type Catalog = { live: boolean; usdPrice: number; countries: Country[]; assets: Asset[]; defaultCountry?: string };

type PaymentView = {
  id: string;
  purpose?: string;
  creditAmount?: number;
  method: Method;
  status: string;
  amount: number;
  currency: string;
  operator?: string | null;
  phone?: string | null;
  isDemo: boolean;
  flow?: string;
  waveUrl?: string;
  ussdCode?: string;
  address?: string;
  memo?: string;
  network?: string;
  cryptoAmount?: string;
  expiresAt?: string;
  instruction?: string;
  error?: string;
};

export default function PaymentStep({
  method,
  mode = "activation",
  onBack,
}: {
  method: Method;
  mode?: "activation" | "deposit";
  onBack?: () => void;
}) {
  const router = useRouter();
  const isDeposit = mode === "deposit";
  const [depositAmount, setDepositAmount] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [operator, setOperator] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentView | null>(null);

  // Load catalog
  useEffect(() => {
    let alive = true;
    fetch("/api/payments/catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return (await r.json()) as Catalog;
      })
      .then((c) => {
        if (!alive) return;
        setCatalog(c);
        const def = c.defaultCountry || c.countries[0]?.code || "";
        setCountryCode(def);
        setAssetCode(c.assets[0]?.code || "");
      })
      .catch(() => alive && setLoadError("Impossible de charger les moyens de paiement."));
    return () => {
      alive = false;
    };
  }, []);

  const country = useMemo(() => catalog?.countries.find((c) => c.code === countryCode), [catalog, countryCode]);

  // Reset operator when country changes
  useEffect(() => {
    if (country && !country.operators.includes(operator)) setOperator(country.operators[0] || "");
  }, [country, operator]);

  const depositValue = Number(depositAmount.replace(/[^\d.]/g, "")) || 0;
  const amountLabel = isDeposit
    ? method === "crypto"
      ? `${depositValue || 0} USD`
      : `${depositValue || 0} ${country?.currency ?? ""}`
    : method === "crypto"
      ? `${catalog?.usdPrice ?? 6} USD`
      : country
        ? `${country.price} ${country.currency}`
        : "…";

  const dial = DIAL_BY_CODE[countryCode] || "";

  async function initiate() {
    if (!catalog || !country) return;
    setError(null);
    if (isDeposit && depositValue <= 0) return setError("Entrez le montant du dépôt.");
    if (method === "mobile_money") {
      const digits = phone.replace(/[^\d]/g, "");
      if (digits.length < 6) return setError("Entrez votre numéro de paiement.");
      if (!operator) return setError("Choisissez un opérateur Mobile Money.");
    }
    setSubmitting(true);
    try {
      const full =
        method === "mobile_money"
          ? (phone.trim().startsWith("+") || phone.replace(/\D/g, "").startsWith(dial.replace("+", ""))
              ? phone
              : `${dial}${phone}`
            ).replace(/[^\d]/g, "")
          : undefined;
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(method === "mobile_money"
            ? { method, countryCode, operator, phone: full }
            : { method, countryCode, assetCode: assetCode || undefined }),
          ...(isDeposit ? { purpose: "deposit", amount: depositValue } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'initier le paiement.");
        return;
      }
      setPayment(data.payment);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !!catalog &&
    !!country &&
    !submitting &&
    (!isDeposit || depositValue > 0) &&
    (method === "crypto" || (phone.replace(/\D/g, "").length >= 6 && !!operator));

  // ---------------------------------------------------------------- render
  return (
    <>
      {!isDeposit && (
        <>
          <ActivationHeader step={2} backHref="/activation/method" />
          <Stepper step={2} />
        </>
      )}
      {isDeposit && (
        <button type="button" onClick={onBack} className="mb-5 flex items-center gap-3 text-[21px] font-medium text-gray-600">
          <ArrowLeft className="h-7 w-7" /> Retour
        </button>
      )}

      <main className={isDeposit ? "pb-32" : "mx-auto max-w-md px-6 pb-40"}>
        {payment ? (
          <PaymentProgress
            payment={payment}
            onUpdate={setPayment}
            onDone={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            onRetry={() => setPayment(null)}
          />
        ) : (
          <section className="card overflow-hidden">
            <div className="bg-primary px-6 py-9 text-center text-white">
              <p className="text-[24px] font-semibold text-white/85">{isDeposit ? "Montant du dépôt" : "Montant de l'activation"}</p>
              <p className="mt-1 text-[54px] font-bold leading-none">{amountLabel}</p>
            </div>

            <div className="px-10 pb-10 pt-8">
              {isDeposit && (
                <div className="mb-8">
                  <label className="label" htmlFor="dep-amount">
                    Montant {method === "crypto" ? "(USD)" : country ? `(${country.currency})` : ""}
                  </label>
                  <input
                    id="dep-amount"
                    inputMode="decimal"
                    className="input text-[21px]"
                    placeholder={method === "crypto" ? "10" : "5000"}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  />
                  <p className="mt-2 text-[16px] text-gray-500">
                    {method === "crypto" ? "1 USD ≈ 483 F crédités sur votre solde." : "Le montant est crédité sur votre solde principal après confirmation."}
                  </p>
                </div>
              )}
              {loadError && <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-red-700">{loadError}</p>}
              {catalog && !catalog.live && (
                <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-[15px] font-medium text-amber-800">
                  Mode démo : ajoutez vos clés AshTechPay pour activer les paiements réels.
                </p>
              )}

              {/* Pays */}
              <label className="label" htmlFor="pay-country">
                Pays
              </label>
              <div className="relative">
                <select
                  id="pay-country"
                  className="input appearance-none pr-12 text-[21px]"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={!catalog}
                >
                  {!catalog && <option>Chargement…</option>}
                  {catalog?.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {englishCountryName(c.code, c.name)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink" />
              </div>

              {method === "mobile_money" ? (
                <>
                  <label className="label mt-8" htmlFor="pay-phone">
                    Numéro de paiement
                  </label>
                  <input
                    id="pay-phone"
                    type="tel"
                    inputMode="tel"
                    className="input text-[21px]"
                    placeholder={`${dial} 6XX XXX XXX`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))}
                  />

                  <p className="label mt-8">Opérateur Mobile Money</p>
                  <div className="grid grid-cols-3 gap-4">
                    {country?.operators.map((op, i) => {
                      const active = op === operator;
                      return (
                        <button
                          type="button"
                          key={op}
                          onClick={() => setOperator(op)}
                          className={
                            "relative flex flex-col items-center gap-2 rounded-2xl border-2 px-2 pb-4 pt-5 transition " +
                            (active
                              ? "border-primary bg-primary-soft shadow-[0_0_0_4px_rgba(59,71,243,0.08)]"
                              : i === 1
                                ? "border-gray-200 bg-amber-50/60"
                                : "border-gray-200 bg-gray-50")
                          }
                        >
                          {active && (
                            <span className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                              <Check className="h-5 w-5" strokeWidth={3} />
                            </span>
                          )}
                          <OperatorBadge name={op} className="h-[72px] w-[72px]" />
                          <span className="w-full truncate text-center text-[17px] font-semibold text-ink">{op}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 px-8 py-7">
                    <p className="text-[22px] font-bold text-ink">
                      {isDeposit ? `Montant du dépôt : ${depositValue || 0} USD` : `Frais d'activation : ${catalog?.usdPrice ?? 6} USD`}
                    </p>
                  </div>

                  {catalog && catalog.assets.length > 1 && (
                    <>
                      <label className="label mt-8" htmlFor="asset">
                        Réseau crypto
                      </label>
                      <div className="relative">
                        <select
                          id="asset"
                          className="input appearance-none pr-12 text-[21px]"
                          value={assetCode}
                          onChange={(e) => setAssetCode(e.target.value)}
                        >
                          {catalog.assets.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.name} ({a.network})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink" />
                      </div>
                    </>
                  )}

                  <hr className="my-8 border-gray-200" />
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[20px] text-gray-500">Pays</p>
                      <p className="mt-1 text-[24px] font-bold text-ink">{country ? englishCountryName(country.code, country.name) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[20px] text-gray-500">Service</p>
                      <p className="mt-1 text-[24px] font-bold text-ink">Cryptomonnaie</p>
                    </div>
                  </div>
                  <hr className="mt-8 border-gray-200" />
                </>
              )}

              {error && (
                <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">
                  {error}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {!payment && (
        <div className={"z-20 " + (isDeposit ? "mt-6" : "fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur")}>
          <div className={isDeposit ? "" : "mx-auto max-w-md px-6 py-5"}>
            <button type="button" className="btn-primary" disabled={!canSubmit} onClick={initiate}>
              {submitting ? (
                "Paiement en cours..."
              ) : (
                <>
                  Procéder au paiement
                  <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Progress: pending / otp / crypto details / success / failed            */
/* ---------------------------------------------------------------------- */

function PaymentProgress({
  payment,
  onUpdate,
  onDone,
  onRetry,
}: {
  payment: PaymentView;
  onUpdate: (p: PaymentView) => void;
  onDone: () => void;
  onRetry: () => void;
}) {
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const terminal = ["success", "failed", "expired"].includes(payment.status);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/payments/${payment.id}`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        onUpdate(d.payment);
      }
    } catch {
      /* retry on next tick */
    }
  }, [payment.id, onUpdate]);

  useEffect(() => {
    if (terminal) return;
    timer.current = setTimeout(poll, 4000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [payment, terminal, poll]);

  useEffect(() => {
    if (payment.status === "success") {
      const t = setTimeout(onDone, 2500);
      return () => clearTimeout(t);
    }
  }, [payment.status, onDone]);

  async function submitOtp() {
    setOtpError(null);
    setOtpBusy(true);
    try {
      const r = await fetch(`/api/payments/${payment.id}/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const d = await r.json();
      if (!r.ok) {
        setOtpError(d.error || "OTP invalide.");
        return;
      }
      onUpdate(d.payment);
    } finally {
      setOtpBusy(false);
    }
  }

  function copy(label: string, value: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const amount = `${payment.amount} ${payment.currency}`;

  if (payment.status === "success") {
    return (
      <section className="card px-8 py-14 text-center">
        <CheckCircle2 className="mx-auto h-24 w-24 text-brand-green" strokeWidth={1.8} />
        <h2 className="mt-6 text-[30px] font-bold text-ink">Paiement confirmé !</h2>
        <p className="mt-3 text-[20px] text-gray-500">
          {payment.purpose === "deposit"
            ? `${new Intl.NumberFormat("fr-FR").format(payment.creditAmount ?? 0)} F ont été crédités sur votre solde.`
            : "Votre compte DBI est activé à vie. Redirection vers le tableau de bord…"}
        </p>
        <button type="button" onClick={onDone} className="btn-primary mt-8">
          Accéder au tableau de bord
        </button>
      </section>
    );
  }

  if (payment.status === "failed" || payment.status === "expired") {
    return (
      <section className="card px-8 py-14 text-center">
        <XCircle className="mx-auto h-24 w-24 text-red-500" strokeWidth={1.8} />
        <h2 className="mt-6 text-[30px] font-bold text-ink">
          {payment.status === "expired" ? "Paiement expiré" : "Paiement échoué"}
        </h2>
        <p className="mt-3 text-[20px] text-gray-500">{payment.error || "Le paiement n'a pas abouti. Vous pouvez réessayer."}</p>
        <button type="button" onClick={onRetry} className="btn-primary mt-8">
          Réessayer
        </button>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="bg-primary px-6 py-9 text-center text-white">
        <p className="text-[24px] font-semibold text-white/85">Montant de l&apos;activation</p>
        <p className="mt-1 text-[54px] font-bold leading-none">{amount}</p>
      </div>

      <div className="px-8 pb-10 pt-8">
        {payment.isDemo && (
          <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-[15px] font-medium text-amber-800">
            Mode démo : aucune transaction réelle n&apos;est effectuée.
          </p>
        )}

        {payment.method === "mobile_money" && payment.status !== "otp_required" && (
          <div className="text-center">
            <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Smartphone className="h-12 w-12 animate-pulse" />
            </span>
            <h2 className="mt-6 text-[26px] font-bold text-ink">Confirmez sur votre téléphone</h2>
            <p className="mt-3 text-[19px] leading-snug text-gray-500">{payment.instruction}</p>
            {payment.ussdCode && (
              <p className="mt-4 rounded-2xl bg-gray-100 px-4 py-3 text-[22px] font-bold text-ink">{payment.ussdCode}</p>
            )}
            {payment.waveUrl && (
              <a href={payment.waveUrl} target="_blank" rel="noreferrer" className="btn-primary mt-6">
                Ouvrir Wave <ExternalLink className="h-5 w-5" />
              </a>
            )}
            <dl className="mt-8 grid grid-cols-2 gap-4 text-left">
              <div>
                <dt className="text-[17px] text-gray-500">Opérateur</dt>
                <dd className="text-[20px] font-bold text-ink">{payment.operator}</dd>
              </div>
              <div>
                <dt className="text-[17px] text-gray-500">Numéro</dt>
                <dd className="text-[20px] font-bold text-ink">+{payment.phone}</dd>
              </div>
            </dl>
            <p className="mt-8 flex items-center justify-center gap-3 text-[17px] text-gray-500">
              <span className="spinner !border-primary/30 !border-t-primary" />
              En attente de confirmation…
            </p>
          </div>
        )}

        {payment.status === "otp_required" && (
          <div>
            <h2 className="text-[26px] font-bold text-ink">Code de confirmation</h2>
            <p className="mt-2 text-[19px] text-gray-500">{payment.instruction}</p>
            {payment.ussdCode && (
              <p className="mt-4 rounded-2xl bg-gray-100 px-4 py-3 text-center text-[22px] font-bold text-ink">{payment.ussdCode}</p>
            )}
            <input
              className="input mt-6 text-center text-[28px] tracking-[0.4em]"
              inputMode="numeric"
              maxLength={8}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            />
            {otpError && <p className="mt-3 text-[16px] font-medium text-red-600">{otpError}</p>}
            <button type="button" className="btn-primary mt-6" disabled={otp.length < 4 || otpBusy} onClick={submitOtp}>
              {otpBusy ? <span className="spinner" /> : "Confirmer le code"}
            </button>
          </div>
        )}

        {payment.method === "crypto" && (
          <div>
            <h2 className="text-[26px] font-bold text-ink">Envoyez votre paiement</h2>
            <p className="mt-2 text-[19px] text-gray-500">{payment.instruction}</p>

            <CopyRow label="Montant" value={`${payment.cryptoAmount ?? payment.amount} USDT`} onCopy={copy} copied={copied} />
            <CopyRow label={`Adresse (${payment.network ?? "réseau"})`} value={payment.address ?? "Génération en cours…"} onCopy={copy} copied={copied} mono />
            {payment.memo && <CopyRow label="Memo / Tag (obligatoire)" value={payment.memo} onCopy={copy} copied={copied} mono />}
            {payment.expiresAt && <Countdown expiresAt={payment.expiresAt} />}

            <p className="mt-8 flex items-center justify-center gap-3 text-[17px] text-gray-500">
              <span className="spinner !border-primary/30 !border-t-primary" />
              En attente de la transaction…
            </p>
          </div>
        )}

        <button type="button" onClick={onRetry} className="mt-6 w-full text-center text-[17px] font-medium text-gray-500 underline">
          Annuler et choisir une autre méthode
        </button>
      </div>
    </section>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
  mono,
}: {
  label: string;
  value: string;
  onCopy: (l: string, v: string) => void;
  copied: string | null;
  mono?: boolean;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="text-[15px] text-gray-500">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        <p className={"flex-1 break-all text-[18px] font-bold text-ink " + (mono ? "font-mono text-[15px]" : "")}>{value}</p>
        <button type="button" onClick={() => onCopy(label, value)} className="shrink-0 rounded-xl bg-white p-2 text-primary shadow-sm" aria-label="Copier">
          {copied === label ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt).getTime() - Date.now()));
  useEffect(() => {
    const i = setInterval(() => setLeft(Math.max(0, new Date(expiresAt).getTime() - Date.now())), 1000);
    return () => clearInterval(i);
  }, [expiresAt]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <p className="mt-5 text-center text-[17px] text-gray-500">
      Adresse valable encore{" "}
      <span className="font-bold text-ink">
        {m}:{String(s).padStart(2, "0")}
      </span>
    </p>
  );
}
