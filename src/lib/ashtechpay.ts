import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * AshTechPay Direct API client (https://doc.ashtechpay.com)
 *
 * Env (server-side only):
 *  ASHTECHPAY_API_KEY        ak_... Direct API key
 *  ASHTECHPAY_USER_ID        merchant profile id owning the key
 *  ASHTECHPAY_WEBHOOK_SECRET whsec_... used to verify signed webhooks
 *  ASHTECHPAY_BASE_URL       default https://www.ashtechpay.com/v1
 *  APP_URL                   public https origin (Vercel URL) for notify_url
 *
 * Without an API key the app runs in a clearly-labelled DEMO mode so the
 * whole activation flow can be exercised end-to-end.
 */

export type Obj = Record<string, unknown>;
export type PaymentCountry = { code: string; name: string; currency: string; operators: string[] };
export type CryptoAsset = { code: string; name: string; network: string };

export class AshtechError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "provider_error",
  ) {
    super(message);
  }
}

export function obj(v: unknown): Obj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
}

export function unwrap(v: unknown): unknown {
  const b = obj(v);
  return b.transaction ?? b.data ?? v;
}

export function isLive() {
  return Boolean(process.env.ASHTECHPAY_API_KEY?.startsWith("ak_"));
}

export function merchantId() {
  return process.env.ASHTECHPAY_USER_ID || "";
}

export function notifyUrl() {
  const base = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return undefined;
  try {
    return new URL("/api/webhooks/ashtechpay", base).toString();
  } catch {
    return undefined;
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_otp: "Le code OTP est incorrect. Veuillez réessayer.",
  otp_expired: "La session OTP a expiré. Veuillez relancer le paiement.",
  otp_confirmation_in_progress: "Votre OTP est déjà en cours de confirmation. Patientez un instant.",
  api_not_enabled: "L'accès Direct API n'est pas activé sur ce compte AshTechPay.",
  unauthorized: "Les identifiants du prestataire de paiement doivent être vérifiés.",
  reference_conflict: "Cette référence de paiement est déjà utilisée.",
  insufficient_funds: "Solde insuffisant sur votre compte Mobile Money.",
};

export async function ashtechRequest(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; revalidate?: number } = {},
): Promise<unknown> {
  const key = process.env.ASHTECHPAY_API_KEY;
  if (!key) throw new AshtechError("AshTechPay n'est pas configuré.", 503, "not_configured");
  const base = (process.env.ASHTECHPAY_BASE_URL || "https://www.ashtechpay.com/v1").replace(/\/$/, "");

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(20000),
      ...(options.revalidate ? { next: { revalidate: options.revalidate } } : { cache: "no-store" as const }),
    });
  } catch {
    throw new AshtechError("Impossible de joindre le prestataire de paiement.", 502, "network_error");
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    throw new AshtechError("Réponse illisible du prestataire de paiement.", 502, "invalid_response");
  }

  const data = obj(unwrap(raw));
  const code = String(data.error ?? obj(raw).error ?? "");
  if (res.status === 400 && code === "otp_required") return { ...data, error: "otp_required" };
  if (!res.ok || (code && code !== "otp_required")) {
    const msg =
      ERROR_MESSAGES[code] ||
      (typeof data.message === "string" && data.message) ||
      (typeof obj(raw).message === "string" && (obj(raw).message as string)) ||
      "Le prestataire n'a pas pu accepter cette demande. Vérifiez vos informations.";
    throw new AshtechError(msg, res.status >= 500 ? 502 : 400, code || `http_${res.status}`);
  }
  return raw;
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

// Demo catalog (used only when no API key is configured).
export const DEMO_COUNTRIES: PaymentCountry[] = [
  { code: "BJ", name: "Benin", currency: "XOF", operators: ["Moov Money", "MTN Money", "Celtiis Cash", "Coris Money"] },
  { code: "CM", name: "Cameroon", currency: "XAF", operators: ["MTN Money", "Orange Money"] },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", operators: ["Orange Money", "MTN Money", "Moov Money", "Wave"] },
  { code: "SN", name: "Senegal", currency: "XOF", operators: ["Orange Money", "Wave", "Free Money"] },
  { code: "TG", name: "Togo", currency: "XOF", operators: ["Flooz (Moov)", "Mixx By Yas"] },
  { code: "BF", name: "Burkina Faso", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "NE", name: "Niger", currency: "XOF", operators: ["Airtel Money", "Moov Money"] },
  { code: "GA", name: "Gabon", currency: "XAF", operators: ["Airtel Money", "Moov Money"] },
  { code: "CG", name: "Congo", currency: "XAF", operators: ["MTN Money", "Airtel Money"] },
  { code: "CD", name: "DR Congo", currency: "CDF", operators: ["M-Pesa", "Orange Money", "Airtel Money"] },
  { code: "GH", name: "Ghana", currency: "GHS", operators: ["MTN Mobile Money", "Vodafone Cash", "AirtelTigo Money"] },
  { code: "NG", name: "Nigeria", currency: "NGN", operators: ["OPay", "PalmPay"] },
  { code: "KE", name: "Kenya", currency: "KES", operators: ["M-Pesa", "Airtel Money"] },
];

export const DEMO_ASSETS: CryptoAsset[] = [
  { code: "USDT.TRC20", name: "USDT", network: "TRC20" },
  { code: "USDC.BEP20", name: "USDC", network: "BEP20" },
];

const names = new Intl.DisplayNames(["en"], { type: "region" });

export function normalizeCountries(payload: unknown): PaymentCountry[] {
  const data = unwrap(payload);
  const list = Array.isArray(data) ? data : obj(data).countries;
  if (!Array.isArray(list)) throw new AshtechError("Catalogue des pays indisponible.", 502, "catalog_unavailable");
  return list
    .map((item) => {
      const row = obj(item);
      const code = String(row.code || row.country_code || "").toUpperCase();
      const currency = String(row.currency || "").toUpperCase();
      const name = /^[A-Z]{2}$/.test(code) ? names.of(code) || String(row.name || code) : String(row.name || code);
      const ops = Array.isArray(row.operators)
        ? row.operators
            .map((o) => (typeof o === "string" ? o : String(obj(o).name || "")))
            .filter((o) => o.length > 0)
        : [];
      return { code, name, currency, operators: ops, active: row.active !== false };
    })
    .filter((c) => c.active && /^[A-Z]{2}$/.test(c.code) && /^[A-Z]{3}$/.test(c.currency) && c.operators.length > 0)
    .map(({ active: _a, ...c }) => c)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPaymentCountries(): Promise<{ countries: PaymentCountry[]; live: boolean }> {
  if (!isLive()) return { countries: DEMO_COUNTRIES, live: false };
  try {
    const countries = normalizeCountries(await ashtechRequest("/countries", { revalidate: 600 }));
    return { countries, live: true };
  } catch {
    return { countries: DEMO_COUNTRIES, live: true };
  }
}

export async function getCryptoAssets(): Promise<CryptoAsset[]> {
  if (!isLive()) return DEMO_ASSETS;
  try {
    const data = unwrap(await ashtechRequest("/crypto/assets", { revalidate: 600 }));
    const list = Array.isArray(data) ? data : obj(data).assets;
    if (!Array.isArray(list)) return DEMO_ASSETS;
    const assets = list
      .map((item) => {
        const row = obj(item);
        return {
          code: String(row.asset_code ?? row.code ?? ""),
          name: String(row.name ?? row.currency ?? row.symbol ?? "USDT"),
          network: String(row.network ?? ""),
          active: row.active !== false && row.enabled !== false,
        };
      })
      .filter((a) => a.active && a.code)
      .map(({ active: _a, ...a }) => a);
    return assets.length ? assets : DEMO_ASSETS;
  } catch {
    return DEMO_ASSETS;
  }
}

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

export type CollectInput = {
  amount: number;
  currency: string;
  countryCode: string;
  operator: string;
  phone: string; // digits, international, no "+"
  reference: string;
  otp?: string;
  otpReference?: string;
};

export async function collectMobileMoney(input: CollectInput) {
  const body: Obj = {
    user_id: merchantId(),
    amount: input.amount,
    currency: input.currency,
    country_code: input.countryCode,
    operator: input.operator,
    phone: input.phone,
    reference: input.otpReference || input.reference,
    notify_url: notifyUrl(),
  };
  if (input.otp) body.otp = input.otp;
  return ashtechRequest("/collect", { method: "POST", body });
}

export type CryptoCollectInput = {
  amount: number;
  assetCode: string;
  countryCode: string;
  reference: string;
  customer: { email: string; firstName: string; lastName: string };
};

export async function collectCrypto(input: CryptoCollectInput) {
  return ashtechRequest("/crypto/collect", {
    method: "POST",
    body: {
      user_id: merchantId(),
      amount: input.amount,
      currency: "USDT",
      asset_code: input.assetCode,
      country: input.countryCode,
      reference: input.reference,
      customer: input.customer,
      notify_url: notifyUrl(),
    },
  });
}

export async function getTransaction(providerId: string) {
  return ashtechRequest(`/transaction/${encodeURIComponent(providerId)}`);
}

/** Map provider status strings to our internal statuses. */
export function mapProviderStatus(raw: unknown): "pending" | "success" | "failed" | "expired" | "otp_required" {
  const data = obj(unwrap(raw));
  if (data.error === "otp_required") return "otp_required";
  const s = String(data.status ?? data.state ?? "").toLowerCase();
  if (["success", "successful", "completed", "paid", "confirmed"].includes(s)) return "success";
  if (["failed", "cancelled", "canceled", "rejected", "declined", "error"].includes(s)) return "failed";
  if (["expired", "timeout"].includes(s)) return "expired";
  return "pending";
}

/** Extract user-facing instructions from a collect / crypto collect response. */
export function extractInstructions(raw: unknown): Obj {
  const d = obj(unwrap(raw));
  const out: Obj = {};
  const id = d.transaction_id ?? d.id ?? d.transactionId;
  if (id) out.providerId = String(id);
  if (typeof d.flow === "string") out.flow = d.flow;
  if (typeof d.wave_url === "string") out.waveUrl = d.wave_url;
  if (typeof d.ussd_code === "string") out.ussdCode = d.ussd_code;
  if (typeof d.reference === "string") out.providerReference = d.reference;
  if (typeof d.message === "string") out.providerMessage = d.message;
  // crypto
  const address = d.address ?? d.wallet_address ?? d.pay_address ?? d.deposit_address;
  if (typeof address === "string") out.address = address;
  const memo = d.memo ?? d.tag ?? d.destination_tag;
  if (typeof memo === "string" && memo) out.memo = memo;
  if (typeof d.network === "string") out.network = d.network;
  const cryptoAmount = d.crypto_amount ?? d.pay_amount ?? d.amount;
  if (cryptoAmount !== undefined) out.cryptoAmount = String(cryptoAmount);
  const exp = d.expires_at ?? d.expiry ?? d.expiresAt;
  if (typeof exp === "string" || typeof exp === "number") out.expiresAt = String(exp);
  if (typeof d.qr_code === "string") out.qrCode = d.qr_code;
  return out;
}

/* ------------------------------------------------------------------ */
/* Webhook signature                                                   */
/* ------------------------------------------------------------------ */

export function verifyWebhookSignature(raw: string, timestamp: string, signature: string, secret: string) {
  if (!/^\d{10,13}$/.test(timestamp) || !secret) return false;
  const sig = signature.toLowerCase().startsWith("sha256=") ? signature.toLowerCase() : `sha256=${signature.toLowerCase()}`;
  if (!/^sha256=[a-f0-9]{64}$/.test(sig)) return false;
  const ts = Number(timestamp.length === 13 ? timestamp : `${timestamp}000`);
  if (Math.abs(Date.now() - ts) > 10 * 60 * 1000) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex")}`;
  return Buffer.byteLength(sig) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
