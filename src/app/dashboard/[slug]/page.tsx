import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Hourglass } from "lucide-react";

const TITLES: Record<string, { title: string; desc: string }> = {
  statuts: { title: "Statuts WhatsApp", desc: "Publiez les statuts DBI et gagnez 1,80 FCFA par vue validée." },
  opportunites: { title: "Opportunités Business", desc: "Les meilleures opportunités sélectionnées pour vous." },
  relance: { title: "Relance", desc: "Relancez automatiquement vos prospects." },
  "email-marketing": { title: "Email Marketing", desc: "Créez et envoyez vos campagnes email." },
  gains: { title: "Mes Gains", desc: "Suivez vos revenus en détail." },
  communautes: { title: "Nos Communautés", desc: "Rejoignez nos canaux officiels." },
  services: { title: "Tous les services", desc: "La liste complète des services DBI." },
  classement: { title: "Classement Général", desc: "Le classement mensuel complet des leaders." },
  notifications: { title: "Notifications", desc: "Vos alertes et messages." },
  profil: { title: "Mon profil", desc: "Vos informations personnelles." },
  presentation: { title: "Présentation de la DBI", desc: "Découvrez la présentation officielle de Digital Business Institution." },
};

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "chat" || slug === "support") redirect("/dashboard/messenger");
  const meta = TITLES[slug];
  if (!meta) notFound();
  return (
    <>
      <Link href="/dashboard" className="flex items-center gap-3 text-[20px] text-gray-600">
        <ArrowLeft className="h-6 w-6" /> Retour
      </Link>
      <h1 className="mt-6 text-[34px] font-bold text-ink">{meta.title}</h1>
      <p className="mt-1 text-[20px] text-gray-500">{meta.desc}</p>
      <div className="card mt-8 flex flex-col items-center px-8 py-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Hourglass className="h-12 w-12" />
        </span>
        <p className="mt-6 text-[26px] font-bold text-ink">Bientôt disponible</p>
        <p className="mt-2 text-[18px] text-gray-500">Cette section est en cours de construction. Revenez très vite !</p>
      </div>
    </>
  );
}
