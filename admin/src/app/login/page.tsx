"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { DbiLogo } from "@/components/Shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const r = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form onSubmit={submit} className="card w-full max-w-md px-8 py-10">
        <DbiLogo className="h-14 w-auto" />
        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f6eccf] px-4 py-2 text-[13px] font-extrabold tracking-wide text-[#8a6a1f]"><ShieldCheck className="h-4 w-4" /> ESPACE ADMINISTRATEUR</span>
        <h1 className="mt-4 text-[36px] font-bold text-ink">Connexion</h1>
        <p className="mt-1 text-[18px] text-gray-500">Accès réservé à l&apos;équipe DBI.</p>
        <label className="label mt-7" htmlFor="email">Email</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <label className="label mt-5" htmlFor="pwd">Mot de passe</label>
        <div className="relative">
          <input id="pwd" type={show ? "text" : "password"} className="input pr-14" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" aria-label="Afficher">{show ? <Eye className="h-6 w-6" /> : <EyeOff className="h-6 w-6" />}</button>
        </div>
        {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary mt-7">{busy ? <span className="spinner" /> : "Se connecter"}</button>
      </form>
    </main>
  );
}
