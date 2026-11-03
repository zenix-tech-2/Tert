"use client";

import Link from "next/link";
import { CatalogBrowser } from "@/components/app/CatalogBrowser";

export default function BoutiquePage() {
  return (
    <CatalogBrowser
      kind="product"
      title="Boutique digitale"
      subtitle="Formations, produits digitaux et ressources disponibles sur Digital Business Institution."
      countLabel={(n) => `${n} produit(s)`}
      searchPlaceholder="Rechercher une formation"
      layout="list"
      showPriceRange
      ctaFree="Obtenir"
      ctaPaid={() => "Acheter"}
      actions={
        <>
          <Link href="/dashboard/boutique/bibliotheque" className="flex h-[88px] items-center rounded-2xl border border-gray-300 bg-white px-8 text-[22px] font-medium text-ink">Ma bibliotheque</Link>
          <Link href="/dashboard/boutique/vendeur" className="flex h-[88px] items-center rounded-2xl bg-primary px-8 text-[22px] font-semibold text-white">Espace vendeur</Link>
        </>
      }
    />
  );
}
