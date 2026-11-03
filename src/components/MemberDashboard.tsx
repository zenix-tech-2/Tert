"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Clock3, Copy, Crown, Eye, EyeOff, Trophy } from "lucide-react";
import type { DashboardData } from "@/lib/member-data";
import { formatMoney } from "@/lib/member-format";

const services = [
  { title: "Formation", slug: "formation", sprite: 0 },
  { title: "Contact", slug: "contact", sprite: 1 },
  { title: "Digital Store", slug: "digital-store", sprite: 2, image: "/images/svc-store.png" },
  { title: "Opportunités Business", slug: "opportunites-business", sprite: 3 },
  { title: "Ads Network", slug: "ads-network", sprite: 4, wide: true },
  { title: "Chat DBI", slug: "chat-dbi", sprite: 5 },
  { title: "Relance", slug: "relance", sprite: 6 },
  { title: "Services SMM", slug: "smm", sprite: 7, wide: true },
];

function Sprite({ index }: { index: number }) {
  const positions = ["0% 0%", "33.333% 0%", "66.667% 0%", "100% 0%", "0% 100%", "33.333% 100%", "66.667% 100%", "100% 100%"];
  return <span className="member-service-sprite" style={{ backgroundPosition: positions[index] }} aria-hidden="true" />;
}

export function ServicesGrid({ smmEnabled = false }: { smmEnabled?: boolean }) {
  return <section className="member-services"><div className="member-section-title"><h2>Liste des services</h2><Link href="/services">Voir tout <ArrowRight size={17}/></Link></div><div className="member-service-grid">{services.map((service) => <Link key={service.slug} href={`/services/${service.slug}`} className={`member-service-tile ${service.wide ? "member-service-tile--wide" : ""} ${service.slug === "smm" ? "member-service-tile--smm" : ""}`}>{service.image ? <span className="member-service-sprite member-service-sprite--photo" style={{ backgroundImage: `url(${service.image})` }} aria-hidden="true" /> : <Sprite index={service.sprite} />}<span>{service.title}</span>{service.slug === "smm" && <em className="member-service-smm-badge">{smmEnabled ? "Disponible" : "Bientôt"}</em>}</Link>)}</div></section>;
}

const countryFlags: Record<string, string> = { CM: "🇨🇲", BJ: "🇧🇯", CI: "🇨🇮", SN: "🇸🇳", TG: "🇹🇬", BF: "🇧🇫", ML: "🇲🇱", NE: "🇳🇪", GH: "🇬🇭", NG: "🇳🇬" };
const countryNames: Record<string, string> = { CM: "Cameroun", BJ: "Bénin", CI: "Côte d'Ivoire", SN: "Sénégal", TG: "Togo", BF: "Burkina Faso", ML: "Mali", NE: "Niger", GH: "Ghana", NG: "Nigeria" };

export function Leaderboard({ leaders, leaves }: { leaders: DashboardData["leaders"]; leaves: number }) {
  const sorted = [leaders[1], leaders[0], leaders[2]];
  return <section className="member-leaderboard"><div className="member-leaderboard-title"><h2>Classement Général <Trophy size={21} color="#ff9900"/></h2><Link href="/classement">Voir plus <ChevronRight size={18}/></Link></div><p className="member-leaderboard-subtitle">Filleuls directs qui ont activé leur compte ce mois-ci</p><div className="member-podium">{sorted.map((person, index) => { const center = index === 1; const photo = center ? "/images/leader-1.jpg" : index === 0 ? "/images/leader-2.jpg" : "/images/leader-3.jpg"; return <div key={`${person?.id || "empty"}-${index}`} className={`member-podium-card ${center ? "member-podium-card--first" : ""}`}>{center && <Crown className="member-podium-crown" size={25} color="#ff9b00" />}<div className="member-podium-avatar"><Image src={photo} width={64} height={64} alt=""/><span className={center ? "rank-first" : ""}>{center ? "1" : "2"}</span></div><strong className="member-podium-name">{person?.name || "Place libre"}</strong><small>{person ? `${countryFlags[person.country] || "🌍"} ${countryNames[person.country] || "Membre DBI"}` : "Rejoignez le classement"}</small><div className="member-podium-score"><b>{person?.sales ?? 0}</b><span>ventes</span><em>{center ? "LEADER ÉLITE" : "LEADER GOLD"}</em></div></div>; })}</div><div className="member-ranking-progress"><div><strong>{leaves ? "Continuez votre progression" : "Pas encore classé"}</strong><span>{leaves} ventes</span></div><p>Progression vers Leader Simple <span>{Math.min(leaves,30)}/30</span></p><div className="ranking-track"><i style={{ width: `${Math.min(leaves / 30 * 100, 100)}%` }} /></div></div><p className="member-ranking-note"><Clock3 size={15}/> Classement mensuel, progression mise à jour après chaque activation vérifiée.</p></section>;
}

export function TransactionChart({ transactions, currency }: { transactions: DashboardData["transactions"]; currency: string }) {
  const [period, setPeriod] = useState<"Semaine" | "Mois" | "Année">("Semaine");
  const chart = useMemo(() => {
    const slots = period === "Semaine" ? 7 : period === "Mois" ? 6 : 12;
    const now = new Date();
    const dates = Array.from({ length: slots }, (_, index) => {
      const date = new Date(now);
      if (period === "Semaine") date.setDate(now.getDate() - (slots - index - 1));
      else if (period === "Mois") date.setDate(now.getDate() - (slots - index - 1) * 5);
      else date.setMonth(now.getMonth() - (slots - index - 1));
      return date;
    });
    const values = dates.map((date) => transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt);
      if (tx.currency !== currency) return false;
      if (period === "Semaine") return txDate.toDateString() === date.toDateString();
      if (period === "Mois") return Math.abs(txDate.getTime() - date.getTime()) < 2.5 * 86400000;
      return txDate.getMonth() === date.getMonth() && txDate.getFullYear() === date.getFullYear();
    }).reduce((sum, tx) => sum + tx.amountMinor, 0));
    return { dates, values, max: Math.max(2, ...values.map((value) => Math.abs(value))) };
  }, [period, transactions, currency]);
  const points = chart.values.map((value, index) => `${48 + index * (246 / Math.max(chart.values.length - 1, 1))},${187 - value / chart.max * 140}`).join(" ");
  return <section className="member-transactions-chart"><div className="member-section-title"><h2>Evolution des transactions</h2><Link href="/transactions">Voir tout</Link></div><p>Activité de la semaine, affichée en format compact.</p><strong className="member-ads-total">DBI Ads : 0 {currency}</strong><div className="member-chart-tabs">{(["Semaine", "Mois", "Année"] as const).map((item) => <button type="button" key={item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)}>{item}</button>)}</div><div className="member-chart-legend"><span><i className="legend-green"/>Dépôts</span><span><i className="legend-red"/>Retraits</span><span><i className="legend-blue"/>Commissions</span><span><i className="legend-purple"/>Revenus</span><span><i className="legend-orange"/>DBI Ads</span><span><i className="legend-navy"/>Net</span></div><svg className="member-chart-svg" viewBox="0 0 316 229" preserveAspectRatio="none" role="img" aria-label={`Evolution des transactions sur la période ${period}`}><g stroke="#e7ebf0" strokeWidth="1">{[47,82,117,152,187].map((y) => <line key={y} x1="48" x2="303" y1={y} y2={y}/>)}</g><g fill="#354158" fontSize="12" fontFamily="Outfit, sans-serif"><text x="27" y="51">2</text><text x="20" y="86">1,5</text><text x="27" y="121">1</text><text x="20" y="156">0,5</text><text x="27" y="191">0</text></g><polyline points={points} fill="none" stroke="#15243e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{chart.values.map((value, index) => <circle key={index} cx={48 + index * (246 / Math.max(chart.values.length - 1, 1))} cy={187 - value / chart.max * 140} r="3.6" fill="#15243e" stroke="white" strokeWidth="1.5"/>)}<g fill="#354158" fontSize="11.5" fontFamily="Outfit, sans-serif">{chart.dates.map((date,index) => <text key={index} x={48 + index * (246 / Math.max(chart.dates.length - 1, 1))} y="213" textAnchor="middle">{period === "Année" ? date.toLocaleDateString("fr-FR",{month:"short"}) : `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}`}</text>)}</g></svg></section>;
}

export function MemberDashboard({ user, data, today, smmEnabled }: { user: { fullName: string; countryCode: string }; data: DashboardData; today: string; smmEnabled: boolean }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const name = user.fullName.trim().split(/\s+/)[0] || "Membre";
  const mainBalance = data.wallet.currency === "USD" ? data.wallet.usdBalanceMinor : data.wallet.balanceMinor;
  async function copyCode() {
    try { await navigator.clipboard.writeText(data.memberCode); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  }
  return <main className="member-home">
    <div className="member-home-top">
      <section className="member-wallet-hero"><div className="member-wallet-rings"/><Image className="member-wallet-illustration" src="/images/wallet-hero.png" width={680} height={452} alt="Portefeuille DBI et pièces de monnaie" priority /><div className="member-hero-content"><span className="member-hero-date">{today}</span><h1>Bienvenue,<br/>{name}</h1><div className="member-hero-balance-label">SOLDE PRINCIPAL <button type="button" aria-label={visible ? "Masquer le solde" : "Afficher le solde"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div><div className="member-hero-balance">{visible ? formatMoney(mainBalance, data.wallet.currency) : <><span>••••••</span> {data.wallet.currency}</>}</div></div><Link className="member-hero-next" href="/portefeuilles" aria-label="Voir mon portefeuille"><ArrowRight size={22}/></Link><div className="member-identity-card"><div className="member-identity-avatar">{name}</div><div className="member-identity-details"><small>MATRICULE</small><strong>{data.memberCode}</strong><small>FEUILLES</small><b>{data.leaves}</b></div><button type="button" className="member-identity-copy" onClick={copyCode}><Copy size={14}/>{copied ? "Copié !" : "Copier"}</button></div></section>
      <section className="member-withdrawal-total"><div><span>TOTAL DES RETRAITS</span><strong>{formatMoney(data.wallet.withdrawnMinor, data.wallet.currency)}</strong></div><Link href="/transfert">Transférer vers DBI <span><ArrowRight size={18}/></span></Link></section>
    </div>
    <ServicesGrid smmEnabled={smmEnabled} />
    <Leaderboard leaders={data.leaders} leaves={data.leaves} />
    <TransactionChart transactions={data.transactions} currency={data.wallet.currency} />
    <Link href="/presentation" className="member-presentation"><span>PRÉSENTATION DE LA DBI</span><strong>Découvrez la présentation officielle de la Digital Business Institution.</strong><ArrowRight size={21}/></Link>
  </main>;
}
