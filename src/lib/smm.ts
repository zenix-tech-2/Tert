import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { smmOrders, transactions, users, type SmmOrder, type User } from "@/db/schema";
import { txRef, WalletError } from "./wallet";
import { CONVERSION_RATE } from "./market";

/**
 * SMM providers (standard SMM-panel API: key + action=services|add|status|refill|balance).
 *   - Peakerr    https://peakerr.com/api   (PEAKERR_API_KEY,   PEAKERR_API_URL   default https://peakerr.com/api/v2)
 *   - SMM Africa https://smm.africa/api-docs (SMMAFRICA_API_KEY, SMMAFRICA_API_URL default https://smm.africa/api/v3)
 * Each provider is enabled independently by its key; you can configure one or both.
 * When none is configured the SMM module shows "Bientôt".
 *   DBI_SMM_MARKUP_PCT optional markup on provider rate (default 40)
 *   DBI_SMM_MIN_PRICE optional minimum charge in FCFA (default 100)
 */

export type ProviderId = "peakerr" | "smmafrica";

export const PROVIDERS: Record<ProviderId, { id: ProviderId; label: string; keyEnv: string; url: () => string; key: () => string | undefined }> = {
  peakerr: { id: "peakerr", label: "Peakerr", keyEnv: "PEAKERR_API_KEY", url: () => process.env.PEAKERR_API_URL || "https://peakerr.com/api/v2", key: () => process.env.PEAKERR_API_KEY },
  smmafrica: { id: "smmafrica", label: "SMM Africa", keyEnv: "SMMAFRICA_API_KEY", url: () => process.env.SMMAFRICA_API_URL || "https://smm.africa/api/v3", key: () => process.env.SMMAFRICA_API_KEY },
};

export const SMM = {
  enabledProviders: () => (Object.values(PROVIDERS).filter((p) => Boolean(p.key())).map((p) => p.id) as ProviderId[]),
  enabled: () => Object.values(PROVIDERS).some((p) => Boolean(p.key())),
  markupPct: Number(process.env.DBI_SMM_MARKUP_PCT || 40),
  minPrice: Number(process.env.DBI_SMM_MIN_PRICE || 100),
};

export type SmmService = {
  provider: ProviderId;
  providerLabel: string;
  service: number;
  name: string;
  type: string;
  category: string;
  rate: number; // provider USD per 1000
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
  pricePer1000Xaf: number; // member price per 1000 in FCFA
  platform: string; // derived from category/name (Instagram, TikTok, …)
};

export class SmmError extends WalletError {}

async function call<T = unknown>(provider: ProviderId, params: Record<string, string | number | undefined>): Promise<T> {
  const cfg = PROVIDERS[provider];
  const key = cfg.key();
  if (!key) throw new SmmError(`${cfg.label} n'est pas configuré.`, 503);
  const body = new URLSearchParams({ key });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") body.set(k, String(v));
  let res: Response;
  try {
    res = await fetch(cfg.url(), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body, cache: "no-store", signal: AbortSignal.timeout(20000) });
  } catch {
    throw new SmmError(`${cfg.label} est injoignable. Réessayez plus tard.`, 502);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new SmmError(`Réponse invalide de ${cfg.label}.`, 502);
  }
  if (data && typeof data === "object" && !Array.isArray(data) && "error" in data) {
    throw new SmmError(`${cfg.label} : ${String((data as { error: unknown }).error)}`, 400);
  }
  return data as T;
}

const PLATFORMS = ["Instagram", "TikTok", "Facebook", "YouTube", "WhatsApp", "Telegram", "Twitter", "X ", "Spotify", "LinkedIn", "Snapchat", "Threads", "Twitch", "Discord", "Kick", "Pinterest", "SoundCloud", "Website", "Google"];

function platformOf(category: string, name: string) {
  const hay = `${category} ${name}`.toLowerCase();
  for (const p of PLATFORMS) if (hay.includes(p.toLowerCase().trim())) return p.trim() === "X" ? "Twitter" : p.trim();
  return "Autres";
}

export function priceXafPer1000(rateUsd: number) {
  return Math.ceil(rateUsd * CONVERSION_RATE * (1 + SMM.markupPct / 100));
}

export function quote(service: SmmService, quantity: number) {
  const raw = (service.pricePer1000Xaf * quantity) / 1000;
  return Math.max(SMM.minPrice, Math.ceil(raw));
}

/* ---------------- catalog (cached in memory for 10 min) ---------------- */

const cache: Partial<Record<ProviderId, { at: number; items: SmmService[] }>> = {};

async function providerServices(provider: ProviderId, force: boolean): Promise<SmmService[]> {
  const c = cache[provider];
  if (!force && c && Date.now() - c.at < 10 * 60_000) return c.items;
  const raw = await call<Array<Record<string, unknown>>>(provider, { action: "services" });
  const items: SmmService[] = (Array.isArray(raw) ? raw : [])
    .map((r) => {
      const rate = Number(r.rate) || 0;
      return {
        provider,
        providerLabel: PROVIDERS[provider].label,
        service: Number(r.service),
        name: String(r.name ?? ""),
        type: String(r.type ?? "Default"),
        category: String(r.category ?? "Autres"),
        rate,
        min: Number(r.min) || 1,
        max: Number(r.max) || 1_000_000,
        refill: Boolean(r.refill),
        cancel: Boolean(r.cancel),
        pricePer1000Xaf: priceXafPer1000(rate),
        platform: platformOf(String(r.category ?? ""), String(r.name ?? "")),
      };
    })
    .filter((s) => s.service > 0 && s.name);
  cache[provider] = { at: Date.now(), items };
  return items;
}

/** Merged catalog of every configured provider. A provider that fails is skipped (others still work). */
export async function listServices(force = false): Promise<{ services: SmmService[]; errors: string[] }> {
  const errors: string[] = [];
  const lists = await Promise.all(
    SMM.enabledProviders().map(async (p) => {
      try {
        return await providerServices(p, force);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : `${PROVIDERS[p].label} indisponible.`);
        return [];
      }
    }),
  );
  return { services: lists.flat(), errors };
}

export async function getService(provider: ProviderId, id: number) {
  const items = await providerServices(provider, false);
  return items.find((s) => s.service === id) ?? null;
}

/* ---------------- orders ---------------- */

export type OrderInput = { provider: ProviderId; serviceId: number; link: string; quantity: number; comments?: string; username?: string; runs?: number; interval?: number };

export async function placeOrder(user: User, input: OrderInput) {
  if (!SMM.enabled()) throw new SmmError("Service SMM bientôt disponible.", 503);
  if (!PROVIDERS[input.provider]?.key()) throw new SmmError("Ce fournisseur n'est pas activé.", 503);
  if (user.status !== "active") throw new SmmError("Activez votre compte pour commander.", 403);
  const service = await getService(input.provider, input.serviceId);
  if (!service) throw new SmmError("Service introuvable ou retiré par le fournisseur.", 404);
  const qty = Math.floor(input.quantity);
  if (!Number.isFinite(qty) || qty < service.min || qty > service.max) throw new SmmError(`Quantité entre ${service.min} et ${service.max}.`, 422);
  let link = input.link.trim();
  if (!/^https?:\/\//i.test(link)) link = `https://${link}`;
  try {
    new URL(link);
  } catch {
    throw new SmmError("Lien invalide.", 422);
  }
  const isCustomComments = /comment/i.test(service.type) && /custom/i.test(service.type);
  if (isCustomComments && !input.comments?.trim()) throw new SmmError("Saisissez les commentaires (un par ligne).", 422);
  const price = quote(service, qty);
  const costUsd = Math.round((service.rate * qty) / 1000 * 100);

  // 1) Debit balance and create the local order first (so money is never lost).
  const order = await db.transaction(async (tx) => {
    const [u] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
    if (!u || u.balance < price) throw new SmmError(`Solde insuffisant : ${price} FCFA requis. Effectuez un dépôt.`, 422);
    await tx.update(users).set({ balance: sql`${users.balance} - ${price}` }).where(eq(users.id, user.id));
    await tx.insert(transactions).values({ userId: user.id, type: "purchase", amount: price, currency: "XAF", status: "completed", reference: txRef("SM"), label: `SMM : ${service.name}`, meta: { serviceId: service.service, quantity: qty, link } });
    const [row] = await tx
      .insert(smmOrders)
      .values({ userId: user.id, provider: input.provider, serviceId: service.service, serviceName: service.name, category: service.category, link, quantity: qty, priceXaf: price, costUsd, status: "pending", extra: { platform: service.platform, type: service.type } })
      .returning();
    return row;
  });

  // 2) Send to Peakerr; refund automatically on provider rejection.
  try {
    const res = await call<{ order?: number | string }>(input.provider, { action: "add", service: service.service, link, quantity: qty, comments: input.comments?.trim(), username: input.username?.trim(), runs: input.runs, interval: input.interval });
    if (!res?.order) throw new SmmError("Le fournisseur n'a pas renvoyé de numéro de commande.", 502);
    const [updated] = await db.update(smmOrders).set({ providerOrderId: String(res.order), status: "in_progress", updatedAt: new Date() }).where(eq(smmOrders.id, order.id)).returning();
    return updated;
  } catch (e) {
    await refund(order, e instanceof Error ? e.message : "Erreur fournisseur");
    throw e instanceof SmmError ? e : new SmmError("Commande refusée par le fournisseur. Vous avez été remboursé.", 502);
  }
}

async function refund(order: SmmOrder, reason: string) {
  await db.transaction(async (tx) => {
    await tx.update(users).set({ balance: sql`${users.balance} + ${order.priceXaf}` }).where(eq(users.id, order.userId));
    await tx.insert(transactions).values({ userId: order.userId, type: "deposit", amount: order.priceXaf, currency: "XAF", status: "completed", reference: txRef("RF"), label: `Remboursement SMM : ${order.serviceName}`, meta: { orderId: order.id, reason } });
    await tx.update(smmOrders).set({ status: "failed", extra: { ...order.extra, error: reason, refunded: true }, updatedAt: new Date() }).where(eq(smmOrders.id, order.id));
  });
}

function mapStatus(s: string): SmmOrder["status"] {
  const v = s.toLowerCase();
  if (v.includes("complet")) return "completed";
  if (v.includes("partial")) return "partial";
  if (v.includes("progress")) return "in_progress";
  if (v.includes("process")) return "processing";
  if (v.includes("cancel")) return "canceled";
  if (v.includes("fail") || v.includes("error")) return "failed";
  return "pending";
}

/** Refresh non-terminal orders from the provider (batched). */
export async function syncOrders(userId: string) {
  if (!SMM.enabled()) return;
  const open = await db
    .select()
    .from(smmOrders)
    .where(and(eq(smmOrders.userId, userId), inArray(smmOrders.status, ["pending", "in_progress", "processing", "partial"]), sql`${smmOrders.providerOrderId} is not null`))
    .limit(100);
  if (!open.length) return;
  for (const provider of SMM.enabledProviders()) {
    const mine = open.filter((o) => o.provider === provider);
    if (!mine.length) continue;
  try {
    const ids = mine.map((o) => o.providerOrderId!).join(",");
    const res = await call<Record<string, { status?: string; start_count?: string; remains?: string; error?: string }>>(provider, { action: "status", orders: ids });
    for (const o of mine) {
      const r = res?.[o.providerOrderId!];
      if (!r || r.error) continue;
      const status = mapStatus(String(r.status ?? ""));
      const prev = o.status;
      await db.update(smmOrders).set({ status, startCount: r.start_count !== undefined ? Number(r.start_count) : o.startCount, remains: r.remains !== undefined ? Number(r.remains) : o.remains, updatedAt: new Date() }).where(eq(smmOrders.id, o.id));
      // Partial refund on provider-side cancellation / partial delivery
      if (status === "canceled" && prev !== "canceled") await refund({ ...o, status }, "Annulée par le fournisseur");
      if (status === "partial" && prev !== "partial" && r.remains) {
        const back = Math.floor((o.priceXaf * Number(r.remains)) / o.quantity);
        if (back > 0)
          await db.transaction(async (tx) => {
            await tx.update(users).set({ balance: sql`${users.balance} + ${back}` }).where(eq(users.id, o.userId));
            await tx.insert(transactions).values({ userId: o.userId, type: "deposit", amount: back, currency: "XAF", status: "completed", reference: txRef("RF"), label: `Remboursement partiel SMM : ${o.serviceName}`, meta: { orderId: o.id, remains: r.remains } });
          });
      }
    }
  } catch {
    /* keep local state; retry next time */
  }
  }
}

export async function listOrders(userId: string, limit = 50) {
  return db.select().from(smmOrders).where(eq(smmOrders.userId, userId)).orderBy(desc(smmOrders.createdAt)).limit(limit);
}

export async function requestRefill(user: User, orderId: string) {
  const [o] = await db.select().from(smmOrders).where(and(eq(smmOrders.id, orderId), eq(smmOrders.userId, user.id))).limit(1);
  if (!o?.providerOrderId) throw new SmmError("Commande introuvable.", 404);
  const res = await call<{ refill?: unknown }>(o.provider as ProviderId, { action: "refill", order: o.providerOrderId });
  await db.update(smmOrders).set({ extra: { ...o.extra, refill: res?.refill ?? true, refillAt: new Date().toISOString() }, updatedAt: new Date() }).where(eq(smmOrders.id, o.id));
  return res;
}

export async function providerBalances() {
  const out: { provider: ProviderId; label: string; balance: string | null; currency: string | null }[] = [];
  for (const p of SMM.enabledProviders()) {
    try {
      const r = await call<{ balance: string; currency: string }>(p, { action: "balance" });
      out.push({ provider: p, label: PROVIDERS[p].label, balance: r.balance, currency: r.currency });
    } catch {
      out.push({ provider: p, label: PROVIDERS[p].label, balance: null, currency: null });
    }
  }
  return out;
}
