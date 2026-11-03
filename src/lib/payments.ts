import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { payments, users, type Payment, type User } from "@/db/schema";
import {
  AshtechError,
  collectCrypto,
  collectMobileMoney,
  extractInstructions,
  getCryptoAssets,
  getPaymentCountries,
  getTransaction,
  isLive,
  mapProviderStatus,
  obj,
  unwrap,
} from "./ashtechpay";
import { ACTIVATION_PRICE_USD, activationPriceFor } from "./pricing";
import { creditBalance, payReferralCommission, XAF_PER_USD } from "./wallet";
import { transactions } from "@/db/schema";

const TERMINAL = ["success", "failed", "expired"];
const DEMO_CONFIRM_MS = 20_000; // demo payments auto-confirm after 20s

export class PaymentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

function newReference() {
  return `dbi_${Date.now().toString(36)}${randomBytes(6).toString("hex")}`;
}

export function publicPayment(p: Payment) {
  const d = p.details || {};
  return {
    id: p.id,
    reference: p.reference,
    purpose: p.purpose,
    creditAmount: p.creditAmount,
    method: p.method,
    countryCode: p.countryCode,
    currency: p.currency,
    amount: p.amount,
    operator: p.operator,
    phone: p.phone,
    assetCode: p.assetCode,
    status: p.status,
    isDemo: p.isDemo,
    createdAt: p.createdAt.toISOString(),
    flow: d.flow,
    waveUrl: d.waveUrl,
    ussdCode: d.ussdCode,
    address: d.address,
    memo: d.memo,
    network: d.network,
    cryptoAmount: d.cryptoAmount,
    expiresAt: d.expiresAt,
    qrCode: d.qrCode,
    instruction: d.instruction,
    error: d.error,
  };
}

async function activateUser(userId: string, p?: Payment) {
  const rows = await db
    .update(users)
    .set({ status: "active", activatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.status, "pending")))
    .returning({ id: users.id });
  if (rows.length) {
    await db.insert(transactions).values({
      userId,
      type: "activation",
      amount: p?.amount ?? 0,
      currency: p?.currency ?? "XAF",
      status: "completed",
      reference: p?.reference ?? `ACT${Date.now()}`,
      label: "Activation du compte DBI",
      operator: p?.operator ?? (p?.method === "crypto" ? "Crypto" : null),
    });
    await payReferralCommission(userId).catch((e) => console.error("commission error", e));
  }
}

/** Called once when a payment reaches "success". */
async function settle(p: Payment) {
  if (p.purpose === "deposit") {
    await creditBalance(p.userId, p.creditAmount, "deposit", `Dépôt ${p.method === "crypto" ? "crypto" : p.operator ?? "Mobile Money"}`, {
      paymentId: p.id,
      reference: p.reference,
      paid: `${p.amount} ${p.currency}`,
    });
  } else {
    await activateUser(p.userId, p);
  }
}

async function setStatus(p: Payment, status: string, extra: Record<string, unknown> = {}) {
  const [updated] = await db
    .update(payments)
    .set({ status, details: { ...p.details, ...extra }, updatedAt: new Date() })
    .where(and(eq(payments.id, p.id), status === "success" ? sql`${payments.status} <> 'success'` : sql`true`))
    .returning();
  if (!updated) return p; // already settled concurrently
  if (status === "success") await settle(updated);
  return updated;
}

/** FCFA credited to the wallet for a given paid amount. */
export function creditFor(amount: number, currency: string) {
  const c = currency.toUpperCase();
  if (c === "XAF" || c === "XOF") return amount;
  if (c === "USD" || c === "USDT") return Math.round(amount * XAF_PER_USD);
  // other currencies: scale by the activation price ratio (2900 F equivalent)
  return Math.round((amount / activationPriceFor(c)) * 2900);
}

/* ------------------------------------------------------------------ */

export type InitiateInput = (
  | { method: "mobile_money"; countryCode: string; operator: string; phone: string }
  | { method: "crypto"; countryCode: string; assetCode?: string }
) & { purpose?: "activation" | "deposit"; amount?: number };

export async function initiatePayment(user: User, input: InitiateInput): Promise<Payment> {
  const purpose = input.purpose ?? "activation";
  if (purpose === "activation" && user.status === "active") throw new PaymentError("Votre compte est déjà activé.", 409);
  if (purpose === "deposit") {
    if (user.status !== "active") throw new PaymentError("Activez votre compte avant de déposer.", 403);
    if (!input.amount || !Number.isFinite(input.amount) || input.amount <= 0) throw new PaymentError("Montant de dépôt invalide.", 422);
  }

  // Expire any previous non-terminal attempt so only one is live at a time.
  await db
    .update(payments)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(eq(payments.userId, user.id), eq(payments.status, "created")));

  const reference = newReference();
  const live = isLive();

  if (input.method === "mobile_money") {
    const { countries } = await getPaymentCountries();
    const country = countries.find((c) => c.code === input.countryCode.toUpperCase());
    if (!country) throw new PaymentError("Ce pays n'est pas disponible pour le Mobile Money.", 422);
    if (!country.operators.includes(input.operator)) throw new PaymentError("Opérateur invalide pour ce pays.", 422);
    const phone = input.phone.replace(/[^\d]/g, "");
    if (!/^\d{8,15}$/.test(phone)) throw new PaymentError("Numéro de paiement invalide (8 à 15 chiffres).", 422);

    const amount = purpose === "deposit" ? Math.ceil(input.amount!) : activationPriceFor(country.currency);
    if (purpose === "deposit" && amount < (country.currency === "XAF" || country.currency === "XOF" ? 100 : 1)) {
      throw new PaymentError("Le dépôt minimum est de 100 F.", 422);
    }
    const [created] = await db
      .insert(payments)
      .values({
        userId: user.id,
        reference,
        purpose,
        creditAmount: purpose === "deposit" ? creditFor(amount, country.currency) : 0,
        method: "mobile_money",
        countryCode: country.code,
        currency: country.currency,
        amount,
        operator: input.operator,
        phone,
        status: "created",
        isDemo: !live,
        details: {},
      })
      .returning();

    if (!live) {
      return setStatus(created, "pending", {
        providerId: `demo_${created.id}`,
        instruction: "Mode démo : le paiement sera confirmé automatiquement dans quelques secondes.",
      });
    }

    try {
      const raw = await collectMobileMoney({
        amount,
        currency: country.currency,
        countryCode: country.code,
        operator: input.operator,
        phone,
        reference,
      });
      return await saveInitiation(created, raw);
    } catch (e) {
      return setStatus(created, "failed", { error: e instanceof Error ? e.message : "Échec de l'initiation." });
    }
  }

  // Crypto
  const assets = await getCryptoAssets();
  const asset = (input.assetCode && assets.find((a) => a.code === input.assetCode)) || assets[0];
  if (!asset) throw new PaymentError("Aucun actif crypto disponible.", 503);
  const usdAmount = purpose === "deposit" ? Math.max(1, Math.ceil(input.amount!)) : ACTIVATION_PRICE_USD;
  const [created] = await db
    .insert(payments)
    .values({
      userId: user.id,
      reference,
      purpose,
      creditAmount: purpose === "deposit" ? creditFor(usdAmount, "USD") : 0,
      method: "crypto",
      countryCode: input.countryCode.toUpperCase(),
      currency: "USD",
      amount: usdAmount,
      assetCode: asset.code,
      status: "created",
      isDemo: !live,
      details: { network: asset.network },
    })
    .returning();

  if (!live) {
    return setStatus(created, "pending", {
      providerId: `demo_${created.id}`,
      address: "TDemoAddressXXXXXXXXXXXXXXXXXXXXXXXX",
      network: asset.network,
      cryptoAmount: usdAmount.toFixed(2),
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      instruction: "Mode démo : aucune adresse réelle. Le paiement sera confirmé automatiquement.",
    });
  }

  const [firstName, ...rest] = user.name.trim().split(/\s+/);
  try {
    const raw = await collectCrypto({
      amount: usdAmount,
      assetCode: asset.code,
      countryCode: created.countryCode,
      reference,
      customer: { email: user.email, firstName: firstName || user.name, lastName: rest.join(" ") || firstName || "DBI" },
    });
    return await saveInitiation(created, raw);
  } catch (e) {
    return setStatus(created, "failed", { error: e instanceof Error ? e.message : "Échec de l'initiation." });
  }
}

async function saveInitiation(p: Payment, raw: unknown): Promise<Payment> {
  const info = extractInstructions(raw);
  const status = mapProviderStatus(raw);
  const providerId = typeof info.providerId === "string" ? info.providerId : p.providerId;
  const providerReference = typeof info.providerReference === "string" ? info.providerReference : p.providerReference;

  let instruction = "Validez la demande de paiement sur votre téléphone. Ne saisissez jamais votre code PIN ici.";
  if (status === "otp_required") {
    instruction = info.ussdCode
      ? `Composez ${info.ussdCode} sur votre téléphone puis saisissez le code OTP reçu.`
      : "Saisissez le code OTP envoyé sur votre téléphone.";
  } else if (info.flow === "wave") {
    instruction = "Ouvrez le lien Wave pour approuver votre paiement, puis revenez ici.";
  } else if (p.method === "crypto") {
    instruction = "Envoyez exactement le montant indiqué à l'adresse ci-dessous.";
  }

  const [updated] = await db
    .update(payments)
    .set({
      providerId,
      providerReference,
      status: status === "success" ? "success" : status,
      details: { ...p.details, ...info, instruction },
      updatedAt: new Date(),
    })
    .where(eq(payments.id, p.id))
    .returning();
  if (updated.status === "success") await settle(updated);
  return updated;
}

/* ------------------------------------------------------------------ */

export async function confirmOtp(p: Payment, otp: string): Promise<Payment> {
  if (p.status !== "otp_required") return p;
  if (!/^\d{4,8}$/.test(otp)) throw new PaymentError("Code OTP invalide.", 422);
  if (p.isDemo) {
    if (otp !== "000000") throw new PaymentError("OTP démo : utilisez 000000.", 400);
    return setStatus(p, "pending", { instruction: "OTP accepté. Confirmation en cours..." });
  }
  try {
    const raw = await collectMobileMoney({
      amount: p.amount,
      currency: p.currency,
      countryCode: p.countryCode,
      operator: p.operator || "",
      phone: p.phone || "",
      reference: p.reference,
      otpReference: p.providerReference || undefined,
      otp,
    });
    return await saveInitiation(p, raw);
  } catch (e) {
    if (e instanceof AshtechError && e.code === "invalid_otp") throw new PaymentError(e.message, 400);
    if (e instanceof AshtechError && e.code === "otp_expired") return setStatus(p, "expired", { error: e.message });
    throw new PaymentError(e instanceof Error ? e.message : "Échec de la confirmation OTP.", 400);
  }
}

/* ------------------------------------------------------------------ */

export async function refreshPayment(p: Payment): Promise<Payment> {
  if (TERMINAL.includes(p.status)) return p;

  if (p.isDemo) {
    if (p.status === "pending" && Date.now() - p.updatedAt.getTime() > DEMO_CONFIRM_MS) {
      return setStatus(p, "success", { instruction: "Paiement démo confirmé." });
    }
    return p;
  }

  if (!p.providerId || p.status === "otp_required") return p;
  try {
    const raw = await getTransaction(p.providerId);
    const status = mapProviderStatus(raw);
    const data = obj(unwrap(raw));
    if (status !== p.status && status !== "otp_required") {
      return setStatus(p, status, { providerStatus: data.status ?? null });
    }
    return p;
  } catch {
    return p;
  }
}

export async function getPayment(id: string, userId: string) {
  const [p] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, id), eq(payments.userId, userId)))
    .limit(1);
  return p ?? null;
}

export async function getLatestPayment(userId: string) {
  const [p] = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(1);
  return p ?? null;
}

/** Apply a webhook event (provider id + status). */
export async function applyWebhook(providerId: string, reference: string | null, status: string) {
  const [p] = await db
    .select()
    .from(payments)
    .where(reference ? eq(payments.reference, reference) : eq(payments.providerId, providerId))
    .limit(1);
  if (!p || TERMINAL.includes(p.status)) return p ?? null;
  const mapped = mapProviderStatus({ status });
  if (mapped === "pending" || mapped === "otp_required") return p;
  return setStatus({ ...p, providerId: p.providerId || providerId }, mapped, { webhookStatus: status });
}
