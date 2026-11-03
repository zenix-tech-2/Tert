"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Copy, Crown, Eye, EyeOff, Trophy } from "lucide-react";
import { useAppUser, useFeatures } from "./AppShell";
import { SIGNUP_COUNTRIES } from "@/lib/countries";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

/* ------------------------------------------------------------------ */
/* Wallet hero card                                                    */
/* ------------------------------------------------------------------ */

export function WalletCard() {
  const { user } = useAppUser();
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const first = user.name.split(/\s+/)[0];

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2b43ea] via-[#2234c9] to-[#17207d] p-8 text-white shadow-xl">
      <img
        src="/images/wallet-hero.png"
        alt=""
        className="pointer-events-none absolute -right-6 top-24 w-[62%] select-none mix-blend-screen opacity-95"
      />
      <div className="pointer-events-none absolute -right-10 top-10 h-72 w-72 rounded-full border border-white/10" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[17px] font-medium text-white/80">{today}</p>
            <h2 className="mt-3 text-[38px] font-extrabold leading-[1.05]">
              Bienvenue,
              <br />
              {first}
            </h2>
          </div>
          <Link href="/dashboard/portefeuilles" aria-label="Portefeuilles" className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <ArrowRight className="h-8 w-8" />
          </Link>
        </div>

        <div className="mt-9 flex items-center gap-4">
          <p className="text-[17px] font-bold uppercase tracking-wide text-white/80">Solde principal</p>
          <button type="button" onClick={() => setShow((s) => !s)} aria-label="Afficher le solde" className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            {show ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
          </button>
        </div>
        <p className="mt-3 flex items-end gap-4 text-[30px] font-bold text-white/85">
          {show ? <span className="text-[40px] leading-none text-white">{fmt(user.balance)}</span> : <span className="tracking-[0.25em] leading-none">●●●●●●</span>}
          <span>XAF</span>
        </p>

        <div className="mt-8 flex items-center gap-5 rounded-3xl bg-white/10 px-5 py-6 backdrop-blur">
          <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-sky-400 bg-[#0f1b3d] text-[26px] font-semibold text-white">
            {first.slice(0, 7)}
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold uppercase tracking-wide text-white/70">Matricule</p>
            <p className="text-[20px] font-bold">{user.matricule}</p>
            <p className="mt-3 text-[15px] font-semibold uppercase tracking-wide text-white/70">Feuilles</p>
            <p className="text-[28px] font-bold leading-none">{user.feuilles}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(user.matricule || "");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex h-16 items-center gap-2 self-end rounded-2xl bg-white/15 px-5 text-[18px] font-semibold"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Withdrawals total + transfer                                        */
/* ------------------------------------------------------------------ */

export function WithdrawalsCard() {
  const { user, refresh } = useAppUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function transfer() {
    setMsg(null);
    if (user.gains <= 0) {
      router.push("/dashboard/transfert");
      return;
    }
    setBusy(true);
    const r = await fetch("/api/wallet/transfer", { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setMsg(d.error || "Transfert impossible.");
    setMsg(`${fmt(user.gains)} XAF transférés vers votre solde DBI.`);
    refresh();
  }

  return (
    <section className="mt-6 rounded-[32px] bg-[#111a2e] px-8 py-8 text-white shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[17px] font-bold uppercase tracking-wide text-gray-300">Total des retraits</p>
          <p className="mt-3 text-[40px] font-extrabold leading-none text-[#22c55e]">{fmt(user.totalWithdrawn)} XAF</p>
        </div>
        <button
          type="button"
          onClick={transfer}
          disabled={busy}
          className="flex h-[88px] items-center gap-3 rounded-2xl bg-[#f8b61a] px-6 text-[18px] font-bold text-[#111a2e] shadow-lg transition active:scale-[0.98] disabled:opacity-60"
        >
          Transférer vers DBI
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111a2e] text-white">
            <ArrowRight className="h-5 w-5" />
          </span>
        </button>
      </div>
      {msg && <p className="mt-4 text-[15px] text-gray-300">{msg}</p>}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Services grid                                                       */
/* ------------------------------------------------------------------ */

const SERVICES = [
  { label: "Formation", img: "/images/svc-formation.png", href: "/dashboard/formations" },
  { label: "Contact", img: "/images/svc-contact.png", href: "/dashboard/contacts" },
  { label: "Digital Store", img: "/images/svc-store.png", href: "/dashboard/boutique" },
  { label: "Opportunites Business", img: "/images/svc-business.png", href: "/dashboard/opportunites" },
];

export function ServicesGrid() {
  const { smmEnabled } = useFeatures();
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[27px] font-semibold text-ink">Liste des services</h3>
        <Link href="/dashboard/services" className="flex items-center gap-2 text-[18px] font-semibold text-primary">
          Voir tout <ArrowRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {SERVICES.map((s) => (
          <Link key={s.label} href={s.href} className="flex flex-col items-center justify-end rounded-[28px] bg-[#162033] px-2 pb-5 pt-4 text-center shadow-md">
            <img src={s.img} alt="" className="h-24 w-24 object-contain" />
            <span className="mt-2 text-[15px] font-semibold leading-tight text-white">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <Link href="/dashboard/ads-network" className="col-span-2 flex items-center gap-4 rounded-[28px] bg-[#162033] px-5 py-4 shadow-md">
          <img src="/images/svc-ads.png" alt="" className="h-20 w-20 object-contain" />
          <span className="text-[19px] font-bold text-white">Ads Network</span>
        </Link>
        <Link href="/dashboard/messenger" className="flex items-center gap-2 rounded-[28px] bg-[#162033] px-3 py-4 shadow-md">
          <img src="/images/svc-chat.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
          <span className="truncate text-[17px] font-bold text-white">Chat DBI</span>
        </Link>
        <Link href="/dashboard/smm" className="relative flex items-center gap-2 overflow-hidden rounded-[28px] bg-[#162033] px-3 py-4 shadow-md">
          <img src="/images/svc-relance.png" alt="" className="h-20 w-20 shrink-0 object-contain" />
          <span className="truncate text-[17px] font-bold text-white">SMM</span>
          {!smmEnabled && <span className="absolute bottom-3 right-0 rounded-l-lg bg-[#f8b61a] px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-[#111a2e]">BIENTÔT</span>}
        </Link>
      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/* Leaderboard                                                         */
/* ------------------------------------------------------------------ */

export type Leader = { id: string; name: string; countryCode: string; avatarUrl: string | null; sales: number; rank: number; tier: string };

const FLAG: Record<string, string> = { TG: "🇹🇬", CI: "🇨🇮", CM: "🇨🇲", BJ: "🇧🇯", SN: "🇸🇳", BF: "🇧🇫", ML: "🇲🇱", NE: "🇳🇪", GA: "🇬🇦", CG: "🇨🇬", CD: "🇨🇩", GH: "🇬🇭", NG: "🇳🇬", KE: "🇰🇪", GN: "🇬🇳", TD: "🇹🇩" };
const countryName = (c: string) => SIGNUP_COUNTRIES.find((x) => x.code === c)?.name ?? c;

export function Leaderboard({ leaders, mySales }: { leaders: Leader[]; mySales: number }) {
  const ordered = [leaders[1], leaders[0], leaders[2]]; // 2 – 1 – 3 podium
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  nextMonth.setHours(1, 0, 0, 0);
  const target = 30;

  return (
    <section className="card mt-8 px-7 py-8">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-3 text-[30px] font-bold text-ink">
          Classement Général <Trophy className="h-8 w-8 text-orange-500" />
        </h3>
        <Link href="/dashboard/parrainage" className="flex items-center gap-1 text-[21px] font-semibold text-primary">
          Voir plus <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
      <p className="mt-3 text-[20px] leading-snug text-gray-500">Filleuls directs qui ont activé leur compte ce mois-ci</p>

      {leaders.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-gray-300 px-6 py-10 text-center text-[18px] text-gray-500">
          Aucun classement pour le moment. Parrainez vos premiers filleuls pour apparaître ici !
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-3 items-end gap-3">
          {ordered.map((l, i) =>
            l ? (
              <PodiumCard key={l.id} leader={l} center={i === 1} />
            ) : (
              <div key={i} className="h-40 rounded-3xl border border-dashed border-gray-200" />
            ),
          )}
        </div>
      )}

      {/* My progression */}
      <div className="mt-6 rounded-3xl bg-[#eef2ff] px-6 py-7">
        <div className="flex items-center justify-between">
          <p className="text-[27px] font-bold text-ink">{mySales > 0 ? `${mySales} vente${mySales > 1 ? "s" : ""}` : "Pas encore classé"}</p>
          <span className="rounded-full bg-white px-5 py-2 text-[20px] font-bold text-primary">{mySales} ventes</span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[19px] text-gray-600">
          <span>Progression vers Leader Simple</span>
          <span>
            {Math.min(mySales, target)}/{target}
          </span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (mySales / target) * 100)}%` }} />
        </div>
        <p className="mt-5 flex items-start gap-2 text-[16px] text-gray-500">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          Classement mensuel, prochaine réinitialisation le {nextMonth.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} à 01:00
        </p>
      </div>
    </section>
  );
}

function PodiumCard({ leader, center }: { leader: Leader; center: boolean }) {
  const initials = leader.name.slice(0, 2).toUpperCase();
  return (
    <div className={"relative rounded-3xl border-2 bg-white px-3 pb-4 pt-10 text-center " + (center ? "border-primary/30 bg-[#eef2ff]/60 shadow-md" : "border-primary/15 shadow-sm")}>
      {center && <Crown className="absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2 fill-orange-400 text-orange-500" />}
      <div className="relative mx-auto h-24 w-24">
        <span className={"flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 text-[22px] font-bold text-white " + (center ? "border-orange-400 bg-gradient-to-br from-rose-400 to-rose-700" : "border-sky-200 bg-gradient-to-br from-gray-500 to-gray-800")}>
          {leader.avatarUrl ? <img src={leader.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
        </span>
        <span className={"absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white text-[16px] font-bold text-white " + (center ? "bg-orange-500" : "bg-gray-600")}>
          {leader.rank}
        </span>
      </div>
      <p className="mt-3 truncate text-[20px] font-bold text-ink">{leader.name}</p>
      <p className="text-[15px] text-gray-500">
        {FLAG[leader.countryCode] ?? "🌍"} {countryName(leader.countryCode)}
      </p>
      <div className="mt-3 rounded-2xl bg-surface px-2 py-4">
        <p className={"text-[28px] font-bold " + (center ? "text-primary" : "text-ink")}>{leader.sales}</p>
        <p className="text-[15px] text-gray-500">ventes</p>
        <span className={"mt-2 inline-block rounded-full px-3 py-1 text-[12px] font-extrabold tracking-wide " + (center ? "bg-primary-soft text-primary" : "bg-amber-50 text-amber-600")}>
          {leader.tier}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Transactions chart                                                  */
/* ------------------------------------------------------------------ */

export type ChartPoint = { label: string; deposits: number; withdrawals: number; commissions: number; revenue: number; ads: number; net: number };

const SERIES: { key: keyof Omit<ChartPoint, "label">; label: string; color: string }[] = [
  { key: "deposits", label: "Depots", color: "#16a34a" },
  { key: "withdrawals", label: "Retraits", color: "#dc2626" },
  { key: "commissions", label: "Commissions", color: "#2563eb" },
  { key: "revenue", label: "Revenus", color: "#9333ea" },
  { key: "ads", label: "DBI Ads", color: "#d97706" },
  { key: "net", label: "Net", color: "#0f172a" },
];

export function TransactionsChart({ initial, ads }: { initial: ChartPoint[]; ads: number }) {
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [points, setPoints] = useState(initial);

  useEffect(() => {
    if (range === "week") return setPoints(initial);
    fetch(`/api/dashboard/chart?range=${range}`)
      .then((r) => r.json())
      .then((d) => setPoints(d.points))
      .catch(() => {});
  }, [range, initial]);

  const max = Math.max(2, ...points.flatMap((p) => SERIES.map((s) => p[s.key])));
  const niceMax = max <= 2 ? 2 : Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)));
  const W = 560;
  const H = 300;
  const padL = 60;
  const padB = 40;
  const padT = 10;
  const x = (i: number) => padL + (i * (W - padL - 10)) / Math.max(1, points.length - 1);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / niceMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);
  const fmtTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ","));

  return (
    <section className="card mt-8 px-7 py-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[27px] font-semibold text-ink">Evolution des transactions</h3>
        <Link href="/dashboard/transactions" className="text-[20px] font-semibold text-primary">
          Voir tout
        </Link>
      </div>
      <p className="mt-3 text-[20px] leading-snug text-gray-500">
        Activite {range === "week" ? "de la semaine" : range === "month" ? "du mois" : "de l'année"}, affichee en format compact.
      </p>
      <p className="mt-3 text-[21px] font-semibold text-orange-600">DBI Ads : {fmt(ads)} XAF</p>

      <div className="mt-5 grid grid-cols-3 rounded-2xl bg-gray-100 p-1.5">
        {(["week", "month", "year"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={"rounded-xl py-3 text-[19px] font-semibold transition " + (range === r ? "bg-white text-primary shadow" : "text-gray-500")}
          >
            {r === "week" ? "Semaine" : r === "month" ? "Mois" : "Annee"}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2 text-[18px] text-gray-700">
            <span className="h-5 w-5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-6 w-full" role="img" aria-label="Évolution des transactions">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={padL - 12} y={y(t) + 5} textAnchor="end" fontSize="15" fill="#374151">
              {fmtTick(t)}
            </text>
          </g>
        ))}
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline fill="none" stroke={s.color} strokeWidth={s.key === "net" ? 3 : 2} points={points.map((p, i) => `${x(i)},${y(p[s.key])}`).join(" ")} />
            {points.map((p, i) => (
              <circle key={i} cx={x(i)} cy={y(p[s.key])} r={s.key === "net" ? 4 : 3} fill={s.color} />
            ))}
          </g>
        ))}
        {points.map((p, i) => (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fontSize="15" fill="#374151">
            {p.label.length > 5 ? p.label.slice(0, 3) + "…" : p.label}
          </text>
        ))}
      </svg>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function PresentationCard() {
  return (
    <Link href="/dashboard/presentation" className="mt-8 flex items-center gap-4 rounded-[32px] border border-[#c7d2fe] bg-[#eef2ff] px-8 py-8">
      <div className="flex-1">
        <p className="text-[17px] font-extrabold uppercase tracking-wide text-primary">Presentation de la DBI</p>
        <p className="mt-2 text-[22px] font-semibold leading-snug text-ink">Decouvrez la presentation officielle de Digital Business Institution.</p>
      </div>
      <ArrowRight className="h-8 w-8 shrink-0 text-primary" />
    </Link>
  );
}
