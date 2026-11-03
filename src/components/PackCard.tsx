import { Check, CircleCheck, MessageCircle, ShieldCheck, TrendingUp } from "lucide-react";
import { ACTIVATION_PRICE_XOF } from "@/lib/pricing";

const FEATURES = [
  "Plus de 18 formations : IA, monétisation, achats en Chine, Facebook Ads, création de bots WhatsApp etc..",
  "Accès à la Digital Store DBI",
  "Possibilité de gagner entre 100 000 et 500 000 FCFA par mois",
  "Opportunités business",
  "+500 e-books",
  "DBI Ads Network",
  "Contact ciblé pour vos publicités",
  "Support 24/7",
];

export default function PackCard() {
  return (
    <section className="overflow-hidden rounded-3xl border-2 border-brand-green bg-white shadow-md">
      {/* Header */}
      <div className="flex items-center gap-4 bg-brand-green px-6 py-7 text-white">
        <CircleCheck className="h-12 w-12 shrink-0" strokeWidth={2} />
        <h2 className="flex-1 text-[27px] font-bold leading-tight">Inscription à vie à la DBI</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-[40px] font-semibold leading-none text-ink">{ACTIVATION_PRICE_XOF}</span>
          <span className="text-[22px] font-semibold">XOF</span>
        </div>
      </div>

      <div className="px-6 pb-8 pt-10">
        {/* WhatsApp earnings highlight */}
        <div className="rounded-3xl bg-brand-green-soft px-8 pb-8 pt-9">
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
              <MessageCircle className="h-10 w-10" strokeWidth={2.2} />
            </span>
            <p className="text-[27px] font-bold leading-tight text-ink">Gagnez avec vos statuts WhatsApp</p>
          </div>

          <div className="mt-8 flex items-end gap-4">
            <span className="pb-2 text-[26px] font-medium text-brand-green-dark">Gagnez</span>
            <span className="text-[64px] font-bold leading-none text-brand-green">1,80</span>
          </div>
          <p className="mt-3 text-[27px] font-bold text-brand-green-dark">FCFA par vue validée</p>

          <hr className="my-8 border-green-200" />

          <div className="flex items-start gap-4">
            <TrendingUp className="mt-1 h-9 w-9 shrink-0 text-brand-green" strokeWidth={2.5} />
            <p className="text-[24px] leading-snug text-ink">
              <strong className="font-bold">1 000 vues sur vos statuts = 1 800 FCFA</strong> que vous gagnez.
            </p>
          </div>
        </div>

        {/* Features */}
        <ul className="mt-9 space-y-6">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-5">
              <Check className="mt-1 h-8 w-8 shrink-0 text-primary" strokeWidth={2.5} />
              <span className="text-[24px] leading-snug text-ink">{f}</span>
            </li>
          ))}
        </ul>

        <p className="mt-9 flex items-center justify-center gap-3 text-[19px] text-gray-500">
          <ShieldCheck className="h-7 w-7 text-brand-green" />
          Paiement sécurisé · activation définitive
        </p>
      </div>
    </section>
  );
}
