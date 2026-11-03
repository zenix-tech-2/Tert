import { CheckCircle2, XCircle } from "lucide-react";

const ROWS: { label: string; env: string; hint: string }[] = [
  { label: "Base de données", env: "DATABASE_URL", hint: "Même base Supabase que l'application membre." },
  { label: "AshTechPay Direct API", env: "ASHTECHPAY_API_KEY", hint: "Clé ak_… (app membre). Mode démo si absente." },
  { label: "Webhook AshTechPay", env: "ASHTECHPAY_WEBHOOK_SECRET", hint: "whsec_… pour signer les notifications." },
  { label: "Peakerr (SMM)", env: "PEAKERR_API_KEY", hint: "Fournisseur SMM n°1. « Bientôt » si absent." },
  { label: "SMM Africa (SMM)", env: "SMMAFRICA_API_KEY", hint: "Fournisseur SMM n°2. Un seul ou les deux." },
];
const PARAMS: { label: string; env: string; def: string }[] = [
  { label: "Prix activation", env: "—", def: "2900 XOF/XAF · 6 USD" },
  { label: "Commission parrainage", env: "DBI_REFERRAL_COMMISSION", def: "1000 F" },
  { label: "Taux conversion", env: "DBI_CONVERSION_RATE", def: "600 XAF / USD" },
  { label: "Frais transfert DBI", env: "DBI_TRANSFER_FEE_PCT", def: "10 %" },
  { label: "Ads – coût / vue", env: "DBI_ADS_COST_PER_VIEW", def: "3 F" },
  { label: "Ads – gain diffuseur / vue", env: "DBI_ADS_PUBLISHER_PER_VIEW", def: "1,8 F" },
  { label: "Ads – budget min image / vidéo", env: "DBI_ADS_MIN_IMAGE / DBI_ADS_MIN_VIDEO", def: "5 000 / 10 000 F" },
  { label: "SMM – marge", env: "DBI_SMM_MARKUP_PCT", def: "40 %" },
  { label: "Vendeur – souscription", env: "DBI_VENDOR_SUBSCRIPTION", def: "10 000 F / an" },
];

export default function SettingsPage() {
  const env = (k: string) => Boolean(process.env[k]);
  return (
    <>
      <section className="card px-6 py-6">
        <h3 className="text-[18px] font-bold text-ink">Intégrations</h3>
        <p className="text-[13px] text-gray-500">État des variables d&apos;environnement de <strong>ce déploiement admin</strong>. Les clés elles-mêmes ne sont jamais affichées. Configurez les mêmes valeurs sur l&apos;application membre.</p>
        <ul className="mt-4 divide-y divide-gray-100">
          {ROWS.map((r) => (
            <li key={r.env} className="flex items-center gap-4 py-3">
              {env(r.env) ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : <XCircle className="h-6 w-6 shrink-0 text-amber-500" />}
              <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold text-ink">{r.label} <code className="ml-2 rounded bg-surface px-1.5 text-[12px] text-gray-600">{r.env}</code></p><p className="text-[13px] text-gray-500">{r.hint}</p></div>
              <span className={"rounded-lg px-2.5 py-1 text-[12px] font-bold " + (env(r.env) ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{env(r.env) ? "Configuré" : "Non configuré"}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card mt-5 px-6 py-6">
        <h3 className="text-[18px] font-bold text-ink">Paramètres métier</h3>
        <p className="text-[13px] text-gray-500">Valeurs actuelles (variable d&apos;environnement → valeur par défaut). Modifiez-les dans Vercel puis redéployez.</p>
        <table className="mt-4 w-full text-left text-[14px]"><thead className="text-[12px] uppercase tracking-wide text-gray-500"><tr><th className="py-2">Paramètre</th><th>Variable</th><th>Valeur</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{PARAMS.map((p) => <tr key={p.label}><td className="py-2 font-semibold text-ink">{p.label}</td><td><code className="rounded bg-surface px-1.5 text-[12px]">{p.env}</code></td><td>{p.env !== "—" && process.env[p.env.split(" / ")[0]] ? process.env[p.env.split(" / ")[0]] : p.def}</td></tr>)}</tbody></table>
      </section>
      <section className="card mt-5 px-6 py-6">
        <h3 className="text-[18px] font-bold text-ink">Déploiement</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] text-gray-700">
          <li>Vercel → nouveau projet → même dépôt → <strong>Root Directory = <code>admin</code></strong>.</li>
          <li>Variables : <code>DATABASE_URL</code> (identique à l&apos;app membre), optionnellement les clés SMM.</li>
          <li>Promouvoir un membre en administrateur depuis <em>Membres → Promouvoir admin</em>, ou utiliser le compte <code>admin@dbi.app</code> créé par <code>supabase/seed.sql</code>.</li>
        </ol>
        {process.env.MEMBER_APP_URL && <p className="mt-3 text-[14px]">Application membre : <a className="text-primary" href={process.env.MEMBER_APP_URL}>{process.env.MEMBER_APP_URL}</a></p>}
      </section>
    </>
  );
}
