// Countries offered at signup (name in French, ISO code, dial code).
export type SignupCountry = { code: string; name: string; dial: string };

export const SIGNUP_COUNTRIES: SignupCountry[] = [
  { code: "CM", name: "Cameroun", dial: "+237" },
  { code: "BJ", name: "Bénin", dial: "+229" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225" },
  { code: "SN", name: "Sénégal", dial: "+221" },
  { code: "TG", name: "Togo", dial: "+228" },
  { code: "BF", name: "Burkina Faso", dial: "+226" },
  { code: "ML", name: "Mali", dial: "+223" },
  { code: "NE", name: "Niger", dial: "+227" },
  { code: "GN", name: "Guinée", dial: "+224" },
  { code: "GA", name: "Gabon", dial: "+241" },
  { code: "CG", name: "Congo", dial: "+242" },
  { code: "CD", name: "RD Congo", dial: "+243" },
  { code: "TD", name: "Tchad", dial: "+235" },
  { code: "CF", name: "Centrafrique", dial: "+236" },
  { code: "GQ", name: "Guinée équatoriale", dial: "+240" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "RW", name: "Rwanda", dial: "+250" },
  { code: "UG", name: "Ouganda", dial: "+256" },
  { code: "TZ", name: "Tanzanie", dial: "+255" },
  { code: "MA", name: "Maroc", dial: "+212" },
  { code: "DZ", name: "Algérie", dial: "+213" },
  { code: "TN", name: "Tunisie", dial: "+216" },
  { code: "MG", name: "Madagascar", dial: "+261" },
  { code: "HT", name: "Haïti", dial: "+509" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "BE", name: "Belgique", dial: "+32" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "US", name: "États-Unis", dial: "+1" },
];

export const DEFAULT_SIGNUP_COUNTRY = "CM";

export function findSignupCountry(code: string) {
  return SIGNUP_COUNTRIES.find((c) => c.code === code);
}

// Display names (English, like the reference design's payment step).
const ENGLISH_NAMES: Record<string, string> = {
  BJ: "Benin",
  CM: "Cameroon",
  CI: "Côte d'Ivoire",
  SN: "Senegal",
  TG: "Togo",
  BF: "Burkina Faso",
  ML: "Mali",
  NE: "Niger",
  GN: "Guinea",
  GA: "Gabon",
  CG: "Congo",
  CD: "DR Congo",
  TD: "Chad",
  GH: "Ghana",
  NG: "Nigeria",
  KE: "Kenya",
  RW: "Rwanda",
  UG: "Uganda",
  TZ: "Tanzania",
};

export function englishCountryName(code: string, fallback?: string) {
  return ENGLISH_NAMES[code] ?? fallback ?? code;
}

export const DIAL_BY_CODE: Record<string, string> = Object.fromEntries(
  SIGNUP_COUNTRIES.map((c) => [c.code, c.dial]),
);
