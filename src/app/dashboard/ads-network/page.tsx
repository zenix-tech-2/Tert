import Link from "next/link";
import { ArrowLeft, ArrowRight, Megaphone, ShieldCheck, Users } from "lucide-react";

export default function AdsNetworkPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1538e8] to-[#0a1fb3] px-8 pb-9 pt-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-10 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 top-20 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-5">
          <Link href="/dashboard" aria-label="Retour" className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-[#c6f135] text-[#0a1fb3]"><ArrowLeft className="h-8 w-8" strokeWidth={2.5} /></Link>
          <h1 className="text-[38px] font-extrabold leading-tight">DBI Ads Network</h1>
        </div>
        <p className="relative mt-7 max-w-[70%] text-[22px] leading-snug text-white/90">
          Les annonceurs financent des campagnes, les diffuseurs les publient sur <strong className="text-white">WhatsApp</strong> et sont payés pour les <strong className="text-white">vues vérifiées.</strong>
        </p>
        <img src="/images/svc-ads.png" alt="" className="absolute right-6 top-[46%] w-24 opacity-90 mix-blend-screen" />
        <Link href="/dashboard/ads-network/annonceur" className="relative mt-9 inline-flex h-[72px] items-center gap-3 rounded-2xl bg-white px-7 text-[20px] font-bold text-[#1538e8]">En savoir plus <ArrowRight className="h-6 w-6" /></Link>
      </section>

      {/* Advertiser */}
      <RoleCard
        tone="blue"
        badge={<><Users className="h-5 w-5" /> DEVENIR ANNONCEUR</>}
        title={<>Devenir<br />annonceur</>}
        text="Faites voir votre produit par des milliers de personnes. Vous ne payez que les vues uniques ; les rediffusions des jours bonus sont offertes."
        cta="Commencer"
        href="/dashboard/ads-network/annonceur"
        img="/images/ads-advertiser.png"
      />

      {/* Publisher */}
      <RoleCard
        tone="green"
        badge={<><Megaphone className="h-5 w-5" /> ESPACE DIFFUSEUR</>}
        active
        title={<>Mon espace<br />diffuseur</>}
        text="Publiez les campagnes sur votre statut WhatsApp pendant 3 jours et gagnez selon le nombre de personnes qui les ont vues."
        cta="Ouvrir mon espace"
        href="/dashboard/ads-network/diffuseur"
        img="/images/ads-publisher.png"
      />

      <section className="card mt-7 flex items-center gap-6 px-8 py-8">
        <span className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><ShieldCheck className="h-9 w-9" /></span>
        <div>
          <p className="text-[22px] font-bold text-ink">Vous pouvez tenir les deux rôles.</p>
          <p className="mt-1 text-[19px] leading-snug text-gray-500">Rien n&apos;empêche d&apos;être annonceur et diffuseur avec le même compte.</p>
        </div>
      </section>
    </>
  );
}

function RoleCard({ tone, badge, title, text, cta, href, img, active }: { tone: "blue" | "green"; badge: React.ReactNode; title: React.ReactNode; text: string; cta: string; href: string; img: string; active?: boolean }) {
  const blue = tone === "blue";
  return (
    <section className={"relative mt-7 overflow-hidden rounded-[32px] border px-8 pb-9 pt-8 " + (blue ? "border-[#c7d7fb] bg-gradient-to-br from-white to-[#eef3ff]" : "border-[#bfe8cf] bg-gradient-to-br from-white to-[#e4f7ea]")}>
      <div className={"pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full " + (blue ? "bg-[#dce7ff]" : "bg-[#cdeedb]")} />
      <div className="relative flex flex-wrap items-center gap-3">
        <span className={"flex h-14 items-center gap-2 rounded-2xl px-5 text-[16px] font-extrabold tracking-wide " + (blue ? "bg-[#e3ebff] text-[#1538e8]" : "bg-[#d4f1df] text-[#0f8a4b]")}>{badge}</span>
        {active && <span className="flex h-14 items-center gap-2 rounded-2xl bg-[#d4f1df] px-5 text-[16px] font-extrabold tracking-wide text-[#0f8a4b]"><span className="h-3 w-3 rounded-full bg-[#0f8a4b]" /> ACTIF</span>}
      </div>
      <div className="relative mt-6 flex items-center gap-4">
        <div className="flex-1">
          <h2 className={"text-[38px] font-extrabold leading-[1.05] " + (blue ? "text-[#0b1a5c]" : "text-[#0a4a2c]")}>{title}</h2>
          <p className="mt-6 text-[20px] leading-snug text-gray-600">{text}</p>
        </div>
        <div className={"flex h-[220px] w-[220px] shrink-0 items-center justify-center rounded-full " + (blue ? "bg-[#dbe6ff]" : "bg-[#cdeedb]")}>
          <img src={img} alt="" className="h-[180px] w-[180px] object-contain mix-blend-multiply" />
        </div>
      </div>
      <Link href={href} className={"relative mt-6 inline-flex h-[68px] items-center gap-3 rounded-2xl px-7 text-[19px] font-bold text-white " + (blue ? "bg-[#1538e8]" : "bg-[#0f9d58]")}>{cta} <ArrowRight className="h-6 w-6" /></Link>
    </section>
  );
}
