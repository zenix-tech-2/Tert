"use client";

import { CatalogBrowser } from "@/components/app/CatalogBrowser";

export default function FormationsPage() {
  return (
    <CatalogBrowser
      kind="formation"
      title="Formations"
      subtitle="Accedez aux formations gratuites et payantes de Digital Business Institution."
      countLabel={(n) => `${n} formation(s)`}
      searchPlaceholder="Rechercher une formation"
      layout="grid"
      showTypeFilter
      ctaFree="Accéder gratuitement"
      ctaPaid={(p) => `Acheter · ${new Intl.NumberFormat("fr-FR").format(p)} F`}
    />
  );
}
