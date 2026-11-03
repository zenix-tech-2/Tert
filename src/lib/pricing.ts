// Lifetime activation price of a DBI account.
// Base price: 2900 XOF (= 2900 XAF, both pegged to EUR) or 6 USD in crypto.
export const ACTIVATION_PRICE_XOF = 2900;
export const ACTIVATION_PRICE_USD = 6;

// Price per supported Mobile Money currency (major units).
const PRICE_BY_CURRENCY: Record<string, number> = {
  XOF: 2900,
  XAF: 2900,
  USD: 6,
  GHS: 75,
  NGN: 9500,
  KES: 800,
  CDF: 17000,
  GNF: 52000,
  RWF: 8000,
  UGX: 22500,
  TZS: 16000,
  EUR: 5,
};

export function activationPriceFor(currency: string): number {
  const c = currency.toUpperCase();
  if (PRICE_BY_CURRENCY[c]) return PRICE_BY_CURRENCY[c];
  // Optional merchant-defined override: DBI_FX_RATES = {"CUR": unitsPerUSD}
  try {
    const rates = JSON.parse(process.env.DBI_FX_RATES || "{}") as Record<string, number>;
    if (rates[c]) return Math.ceil(ACTIVATION_PRICE_USD * rates[c]);
  } catch {
    // ignore malformed config
  }
  return ACTIVATION_PRICE_USD;
}

export function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} ${currency}`;
}
