"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Info, LogOut, Moon, Settings, Star, Sun, Trash2, UserCircle } from "lucide-react";
import { useAppUser } from "@/components/app/AppShell";
import { OperatorBadge } from "@/components/BrandIcons";
import { englishCountryName } from "@/lib/countries";

type Account = { id: string; operator: string; countryCode: string; phone: string; holderName: string | null; isDefault: boolean };
type Country = { code: string; name: string; operators: string[] };

export default function ReglagesPage() {
  const { user } = useAppUser();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const d = localStorage.getItem("dbi-theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  function toggleTheme() {
    const n = !dark;
    setDark(n);
    localStorage.setItem("dbi-theme", n ? "dark" : "light");
    document.documentElement.classList.toggle("dark", n);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const first = user.name.split(/\s+/)[0];

  return (
    <>
      {/* Account header */}
      <div className="relative -mx-6 -mt-6 mb-6 flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <button type="button" onClick={toggleTheme} aria-label="Thème" className="flex h-[84px] w-[84px] items-center justify-center rounded-full border border-gray-300 text-gray-600">
          {dark ? <Sun className="h-8 w-8" /> : <Moon className="h-8 w-8" />}
        </button>
        <button type="button" onClick={() => setMenu((m) => !m)} className="flex items-center gap-2">
          <span className="flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full bg-primary-soft text-[24px] font-bold text-primary">{first.slice(0, 6)}</span>
          {menu ? <ChevronUp className="h-7 w-7 text-ink" /> : <ChevronDown className="h-7 w-7 text-ink" />}
        </button>

        {menu && (
          <div className="absolute right-6 top-full z-30 mt-2 w-[82%] max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <p className="text-[24px] font-semibold text-ink">{user.name}</p>
            <p className="text-[19px] text-gray-500">{user.email}</p>
            <nav className="mt-5 space-y-1">
              <MenuItem href="/dashboard/profil" icon={<UserCircle />} label="Mon profil" />
              <MenuItem href="/dashboard/reglages" icon={<Settings />} label="Paramètres du compte" onClick={() => setMenu(false)} />
              <MenuItem href="/dashboard/messenger" icon={<Info />} label="Support" />
            </nav>
            <hr className="my-4 border-gray-200" />
            <button type="button" onClick={logout} className="flex w-full items-center gap-5 rounded-2xl px-3 py-4 text-[24px] text-ink hover:bg-gray-50">
              <LogOut className="h-9 w-9 text-gray-500" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>

      <h1 className="text-[40px] font-bold text-ink">Paramètres</h1>
      <p className="mt-1 text-[21px] text-gray-500">Gère la sécurité de ton compte et tes comptes de retrait.</p>

      <PasswordCard />
      <AccountsCard defaultCountry={user.countryCode} />
    </>
  );
}

function MenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-5 rounded-2xl px-3 py-4 text-[24px] text-ink hover:bg-gray-50 [&>svg]:h-9 [&>svg]:w-9 [&>svg]:text-gray-500">
      {icon}
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

function PasswordCard() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const r = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: d.error || "Erreur." });
    setMsg({ ok: true, text: "Mot de passe modifié avec succès." });
    setF({ currentPassword: "", newPassword: "", confirm: "" });
  }

  return (
    <form onSubmit={submit} className="card mt-7 px-7 py-8">
      <h2 className="text-[30px] font-bold text-ink">Modifier le mot de passe</h2>
      <input type="password" className="input mt-6 text-[21px]" placeholder="Mot de passe actuel" autoComplete="current-password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required />
      <input type="password" className="input mt-5 text-[21px]" placeholder="Nouveau mot de passe" autoComplete="new-password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required />
      <input type="password" className="input mt-5 text-[21px]" placeholder="Confirmation" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required />
      {msg && <p className={"mt-4 text-[16px] font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p>}
      <div className="mt-6 flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary !w-auto px-10">
          {busy ? <span className="spinner" /> : "Modifier le mot de passe"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function AccountsCard({ defaultCountry }: { defaultCountry: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [adding, setAdding] = useState(false);
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const [operator, setOperator] = useState("");
  const [phone, setPhone] = useState("");
  const [holderName, setHolderName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch("/api/withdrawal-accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []));

  useEffect(() => {
    load();
    fetch("/api/payments/catalog")
      .then((r) => r.json())
      .then((d) => {
        setCountries(d.countries || []);
        const c = (d.countries || []).find((x: Country) => x.code === defaultCountry) || d.countries?.[0];
        if (c) {
          setCountryCode(c.code);
          setOperator(c.operators[0] || "");
        }
      });
  }, [defaultCountry]);

  const country = countries.find((c) => c.code === countryCode);

  async function add() {
    setError(null);
    setBusy(true);
    const r = await fetch("/api/withdrawal-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operator, countryCode, phone, holderName }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error || "Erreur.");
    setPhone("");
    setHolderName("");
    setAdding(false);
    load();
  }

  return (
    <section className="card mt-7 px-7 py-8">
      <h2 className="text-[30px] font-bold text-ink">Comptes de retrait</h2>
      <p className="mt-1 text-[21px] leading-snug text-gray-500">Ajoute plusieurs comptes mobile money et choisis celui qui sera utilisé par défaut.</p>

      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="btn-primary mt-6">
          Ajouter un compte
        </button>
      ) : (
        <div className="mt-6 rounded-3xl border border-gray-200 bg-surface p-5">
          <label className="label">Pays</label>
          <div className="relative">
            <select
              className="input appearance-none bg-white pr-12"
              value={countryCode}
              onChange={(e) => {
                setCountryCode(e.target.value);
                const c = countries.find((x) => x.code === e.target.value);
                setOperator(c?.operators[0] || "");
              }}
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {englishCountryName(c.code, c.name)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2" />
          </div>
          <label className="label mt-5">Opérateur</label>
          <div className="relative">
            <select className="input appearance-none bg-white pr-12" value={operator} onChange={(e) => setOperator(e.target.value)}>
              {country?.operators.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2" />
          </div>
          <label className="label mt-5">Numéro</label>
          <input className="input bg-white" type="tel" placeholder="651010478" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))} />
          <label className="label mt-5">Nom du titulaire (optionnel)</label>
          <input className="input bg-white" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
          {error && <p className="mt-3 text-[16px] font-medium text-red-600">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="h-14 flex-1 rounded-2xl border border-gray-300 bg-white text-[18px] font-semibold text-gray-700">
              Annuler
            </button>
            <button type="button" onClick={add} disabled={busy || !phone || !operator} className="btn-primary !h-14 flex-1 !text-[18px]">
              {busy ? <span className="spinner" /> : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {accounts.map((a) => (
          <li key={a.id} className={"flex items-center gap-4 rounded-3xl border-2 px-5 py-5 " + (a.isDefault ? "border-primary bg-primary-soft/40" : "border-gray-200 bg-white")}>
            <OperatorBadge name={a.operator} className="h-16 w-16" />
            <div className="flex-1">
              <p className="text-[20px] font-bold text-ink">{a.operator}</p>
              <p className="text-[22px] font-semibold text-ink">{a.phone}</p>
              <p className="text-[15px] text-gray-500">
                {englishCountryName(a.countryCode)} {a.isDefault && "· Par défaut"}
              </p>
            </div>
            {!a.isDefault && (
              <button
                type="button"
                aria-label="Définir par défaut"
                onClick={() => fetch(`/api/withdrawal-accounts/${a.id}`, { method: "PATCH" }).then(load)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-gray-500"
              >
                <Star className="h-6 w-6" />
              </button>
            )}
            <button
              type="button"
              aria-label="Supprimer"
              onClick={() => fetch(`/api/withdrawal-accounts/${a.id}`, { method: "DELETE" }).then(load)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 text-red-500"
            >
              <Trash2 className="h-6 w-6" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
