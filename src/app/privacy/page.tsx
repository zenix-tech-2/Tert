import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <Link href="/register" className="flex items-center gap-3 text-[19px] text-gray-600">
        <ArrowLeft className="h-6 w-6" /> Retour
      </Link>
      <h1 className="mt-6 text-[36px] font-bold text-ink">Politique de confidentialité</h1>
      <div className="mt-5 space-y-4 text-[18px] leading-relaxed text-gray-600">
        <p>DBI collecte uniquement les informations nécessaires au fonctionnement de votre compte : nom, email, pays, numéro WhatsApp et code de parrainage.</p>
        <p>Vos mots de passe sont chiffrés et ne sont jamais stockés en clair. Les paiements sont traités par AshTechPay ; nous ne conservons aucun code PIN ni OTP.</p>
        <p>Vos données ne sont jamais vendues à des tiers. Vous pouvez demander la suppression de votre compte à tout moment via le support.</p>
      </div>
    </main>
  );
}
