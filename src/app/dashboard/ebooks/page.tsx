"use client";

import { CatalogBrowser } from "@/components/app/CatalogBrowser";

export default function EbooksPage() {
  return (
    <CatalogBrowser
      kind="ebook"
      title="Ebooks"
      subtitle="Bibliotheque d'ebooks et ressources Drive."
      countLabel={(n) => `${n} ebook(s)`}
      searchPlaceholder="Rechercher un ebook"
      layout="grid"
      showTypeFilter
      ctaFree="Obtenir l'ebook"
      ctaPaid={(p) => `Obtenir · ${new Intl.NumberFormat("fr-FR").format(p)} F`}
    />
  );
}
