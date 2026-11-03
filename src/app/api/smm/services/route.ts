import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listServices, PROVIDERS, SMM, SmmError } from "@/lib/smm";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const providers = SMM.enabledProviders().map((p) => ({ id: p, label: PROVIDERS[p].label }));
  if (!SMM.enabled()) return NextResponse.json({ enabled: false, providers, services: [], platforms: [], markupPct: SMM.markupPct, minPrice: SMM.minPrice });
  try {
    const { services, errors } = await listServices();
    const platforms = [...new Set(services.map((s) => s.platform))].sort((a, b) => (a === "Autres" ? 1 : b === "Autres" ? -1 : a.localeCompare(b)));
    return NextResponse.json({ enabled: true, providers, services, platforms, markupPct: SMM.markupPct, minPrice: SMM.minPrice, error: errors.length ? errors.join(" · ") : undefined });
  } catch (e) {
    if (e instanceof SmmError) return NextResponse.json({ enabled: true, services: [], platforms: [], error: e.message }, { status: 200 });
    return NextResponse.json({ error: "Catalogue indisponible." }, { status: 500 });
  }
}
