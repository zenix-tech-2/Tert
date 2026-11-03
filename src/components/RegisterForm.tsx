"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { WhatsAppIcon } from "./BrandIcons";
import { DEFAULT_SIGNUP_COUNTRY, SIGNUP_COUNTRIES } from "@/lib/countries";

const WHATSAPP_COMMUNITY = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "https://chat.whatsapp.com/";

export default function RegisterForm({ initialReferral = "" }: { initialReferral?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: DEFAULT_SIGNUP_COUNTRY,
    whatsapp: "",
    referralCode: initialReferral.toUpperCase(),
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  const country = useMemo(() => SIGNUP_COUNTRIES.find((c) => c.code === form.countryCode)!, [form.countryCode]);

  const set = (k: keyof typeof form, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (field === k) {
      setField(null);
      setError(null);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setField(null);
    if (!form.acceptTerms) {
      setError("Vous devez accepter les conditions générales.");
      setField("acceptTerms");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setField("confirmPassword");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setField(data.field || null);
        return;
      }
      router.push(data.next || "/activation");
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setLoading(false);
    }
  }

  const errCls = (k: string) => (field === k ? " !border-red-500 ring-4 ring-red-500/10" : "");

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md px-6 pb-12 pt-10" noValidate>
      <h1 className="text-[46px] font-bold leading-tight tracking-tight text-ink">Inscription</h1>
      <p className="mt-2 text-[21px] leading-snug text-gray-500">
        Créez un compte DBI pour accéder au tableau de bord.
      </p>

      <a
        href={WHATSAPP_COMMUNITY}
        target="_blank"
        rel="noreferrer"
        className="mt-7 flex h-[88px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-green-300 bg-brand-green-soft text-[21px] font-semibold text-[#15803d] transition hover:bg-green-100"
      >
        <WhatsAppIcon className="h-9 w-9 text-[#22c55e]" />
        Rejoindre la communauté WhatsApp
      </a>

      {/* Nom */}
      <div className="mt-8">
        <label className="label" htmlFor="name">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          className={"input" + errCls("name")}
          placeholder="Entrez votre nom complet"
          autoComplete="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>

      {/* Email */}
      <div className="mt-7">
        <label className="label" htmlFor="email">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          className={"input" + errCls("email")}
          placeholder="Entrez votre email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>

      {/* Pays */}
      <div className="mt-7">
        <label className="label" htmlFor="country">
          Pays <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            id="country"
            className="input appearance-none pr-12"
            value={form.countryCode}
            onChange={(e) => set("countryCode", e.target.value)}
          >
            {SIGNUP_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code}) {c.dial}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>
        <p className="mt-2 text-[17px] text-gray-500">Indicatif utilisé automatiquement : {country.dial}</p>
      </div>

      {/* WhatsApp */}
      <div className="mt-7">
        <label className="label" htmlFor="whatsapp">
          Numéro WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          className={"input" + errCls("whatsapp")}
          placeholder="690000000"
          autoComplete="tel-national"
          value={form.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value.replace(/[^\d\s]/g, ""))}
          required
        />
      </div>

      {/* Parrainage */}
      <div className="mt-7">
        <label className="label" htmlFor="referral">
          Code de parrainage
        </label>
        <input
          id="referral"
          className={"input uppercase" + errCls("referralCode")}
          placeholder="OPTIONALCODE"
          value={form.referralCode}
          onChange={(e) => set("referralCode", e.target.value.toUpperCase())}
        />
      </div>

      {/* Password */}
      <div className="mt-7">
        <label className="label" htmlFor="password">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            className={"input pr-14" + errCls("password")}
            placeholder="Entrez votre mot de passe"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={showPwd ? "Masquer" : "Afficher"}
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600"
          >
            {showPwd ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Confirm */}
      <div className="mt-7">
        <label className="label" htmlFor="confirm">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirm"
            type={showPwd2 ? "text" : "password"}
            className={"input pr-14" + errCls("confirmPassword")}
            placeholder="Confirmez votre mot de passe"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={showPwd2 ? "Masquer" : "Afficher"}
            onClick={() => setShowPwd2((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600"
          >
            {showPwd2 ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Terms */}
      <label className="mt-7 flex cursor-pointer items-start gap-4">
        <input
          type="checkbox"
          checked={form.acceptTerms}
          onChange={(e) => set("acceptTerms", e.target.checked)}
          className={
            "mt-1 h-9 w-9 shrink-0 appearance-none rounded-lg border-2 bg-white transition checked:border-primary checked:bg-primary checked:[background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M5 10l3 3 7-7'/%3E%3C/svg%3E\")] checked:bg-center checked:bg-no-repeat " +
            (field === "acceptTerms" ? "border-red-500" : "border-gray-300")
          }
        />
        <span className="text-[21px] leading-snug text-gray-500">
          En créant un compte, vous acceptez les{" "}
          <Link href="/terms" className="font-semibold text-primary">
            conditions générales
          </Link>{" "}
          et notre{" "}
          <Link href="/privacy" className="font-semibold text-primary">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary mt-7" disabled={loading}>
        {loading ? <span className="spinner" /> : "S'inscrire"}
      </button>

      <p className="mt-7 text-center text-[18px] text-gray-500">
        Vous avez déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
