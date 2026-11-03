import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <Link href="/register" className="flex items-center gap-3 text-[19px] text-gray-600">
        <ArrowLeft className="h-6 w-6" /> Retour
      </Link>
      <h1 className="mt-6 text-[36px] font-bold text-ink">Conditions générales</h1>
      <div className="mt-5 space-y-4 text-[18px] leading-relaxed text-gray-600">
        <p>En créant un compte DBI (Digital Business Institution), vous acceptez les présentes conditions.</p>
        <p>L&apos;activation du compte est un paiement unique, définitif et non remboursable qui donne un accès à vie à la plateforme, aux formations et aux programmes de monétisation.</p>
        <p>Les gains liés aux statuts WhatsApp sont calculés sur la base des vues validées par nos systèmes de vérification. Toute tentative de fraude entraîne la suspension du compte.</p>
        <p>DBI se réserve le droit de modifier ses services, tarifs et conditions. Les utilisateurs seront informés via la communauté WhatsApp et l&apos;application.</p>
      </div>
    </main>
  );
}
