import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCryptoAssets, getPaymentCountries } from "@/lib/ashtechpay";
import { ACTIVATION_PRICE_USD, activationPriceFor } from "@/lib/pricing";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [{ countries, live }, assets] = await Promise.all([getPaymentCountries(), getCryptoAssets()]);
  return NextResponse.json({
    live,
    usdPrice: ACTIVATION_PRICE_USD,
    countries: countries.map((c) => ({ ...c, price: activationPriceFor(c.currency) })),
    assets,
    defaultCountry: countries.some((c) => c.code === user.countryCode) ? user.countryCode : countries[0]?.code,
  });
}
