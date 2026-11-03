"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { WhatsAppIcon } from "./BrandIcons";

const WHATSAPP_COMMUNITY = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL || "https://chat.whatsapp.com/";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
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

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md px-6 pb-12 pt-10" noValidate>
      <h1 className="text-[46px] font-bold leading-tight tracking-tight text-ink">Connexion</h1>
      <p className="mt-2 text-[21px] leading-snug text-gray-500">Connectez-vous à votre compte DBI.</p>

      <a
        href={WHATSAPP_COMMUNITY}
        target="_blank"
        rel="noreferrer"
        className="mt-7 flex h-[88px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-green-300 bg-brand-green-soft text-[21px] font-semibold text-[#15803d] transition hover:bg-green-100"
      >
        <WhatsAppIcon className="h-9 w-9 text-[#22c55e]" />
        Rejoindre la communauté WhatsApp
      </a>

      <div className="mt-8">
        <label className="label" htmlFor="email">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          className="input"
          placeholder="Entrez votre email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mt-7">
        <label className="label" htmlFor="password">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? "text" : "password"}
            className="input pr-14"
            placeholder="Entrez votre mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            aria-label={show ? "Masquer" : "Afficher"}
            onClick={() => setShow((s) => !s)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-600"
          >
            {show ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium text-red-700">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary mt-8" disabled={loading}>
        {loading ? <span className="spinner" /> : "Se connecter"}
      </button>

      <p className="mt-7 text-center text-[18px] text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-semibold text-primary">
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}
