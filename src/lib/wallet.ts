import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { transactions, users, withdrawalAccounts, type User } from "@/db/schema";

export const MIN_WITHDRAWAL = 1800; // FCFA
export const MIN_CRYPTO_WITHDRAWAL_USD = 10;
export const REFERRAL_COMMISSION = Number(process.env.DBI_REFERRAL_COMMISSION || 1000); // FCFA per activated referral
export const XAF_PER_USD = 2900 / 6; // store policy: 6 USD = 2900 F

export class WalletError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function txRef(prefix = "TX") {
  return `${prefix}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function makeMatricule() {
  const year = new Date().getFullYear();
  const digits = String(Math.floor(100000 + Math.random() * 900000));
  const letter = "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
  return `DBI${year}${digits}${letter}`;
}

export async function ensureMatricule(user: User): Promise<User> {
  if (user.matricule) return user;
  for (let i = 0; i < 3; i++) {
    try {
      const [u] = await db.update(users).set({ matricule: makeMatricule() }).where(eq(users.id, user.id)).returning();
      return u;
    } catch {
      /* collision, retry */
    }
  }
  return user;
}

/* ------------------------------------------------------------------ */
/* Credits                                                             */
/* ------------------------------------------------------------------ */

export async function creditBalance(
  userId: string,
  amount: number,
  type: string,
  label: string,
  meta: Record<string, unknown> = {},
) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId));
    await tx.insert(transactions).values({ userId, type, amount, currency: "XAF", status: "completed", reference: txRef(), label, meta });
  });
}

export async function creditGains(userId: string, amount: number, type: string, label: string, meta: Record<string, unknown> = {}) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ gains: sql`${users.gains} + ${amount}` })
      .where(eq(users.id, userId));
    await tx.insert(transactions).values({ userId, type, amount, currency: "XAF", status: "completed", reference: txRef(), label, meta });
  });
}

/** Pay referral commission to the sponsor when a referred user activates. */
export async function payReferralCommission(activatedUserId: string) {
  const [u] = await db.select().from(users).where(eq(users.id, activatedUserId)).limit(1);
  if (!u?.referredBy) return;
  const [sponsor] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, u.referredBy)).limit(1);
  if (!sponsor) return;
  await creditGains(sponsor.id, REFERRAL_COMMISSION, "commission", `Commission parrainage – ${u.name}`, { referredUserId: u.id });
}

/* ------------------------------------------------------------------ */
/* Transfer gains -> main balance                                      */
/* ------------------------------------------------------------------ */

export async function transferGainsToBalance(user: User, amount?: number) {
  const value = amount ?? user.gains;
  if (value <= 0) throw new WalletError("Aucun gain à transférer.", 400);
  if (value > user.gains) throw new WalletError("Montant supérieur à vos gains disponibles.", 400);
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ gains: sql`${users.gains} - ${value}`, balance: sql`${users.balance} + ${value}` })
      .where(eq(users.id, user.id));
    await tx.insert(transactions).values({
      userId: user.id,
      type: "transfer",
      amount: value,
      currency: "XAF",
      status: "completed",
      reference: txRef("TR"),
      label: "Transfert des gains vers DBI",
      operator: "DBI",
    });
  });
}

/* ------------------------------------------------------------------ */
/* Withdrawals                                                         */
/* ------------------------------------------------------------------ */

export type WithdrawInput =
  | { method: "mobile_money"; amount: number; operator: string; phone: string; countryCode?: string }
  | { method: "crypto"; amountUsd: number; network: string; address: string };

export async function requestWithdrawal(user: User, input: WithdrawInput) {
  if (user.status !== "active") throw new WalletError("Activez votre compte pour retirer.", 403);

  if (input.method === "mobile_money") {
    const amount = Math.floor(input.amount);
    if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL) throw new WalletError(`Le retrait minimum est de ${MIN_WITHDRAWAL} F.`, 422);
    if (amount > user.balance) throw new WalletError("Solde insuffisant.", 422);
    const phone = input.phone.replace(/[^\d]/g, "");
    if (phone.length < 8) throw new WalletError("Numéro de retrait invalide.", 422);
    if (!input.operator) throw new WalletError("Choisissez un opérateur.", 422);

    return db.transaction(async (tx) => {
      const [locked] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
      if (!locked || locked.balance < amount) throw new WalletError("Solde insuffisant.", 422);
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${amount}`, totalWithdrawn: sql`${users.totalWithdrawn} + ${amount}` })
        .where(eq(users.id, user.id));
      const [row] = await tx
        .insert(transactions)
        .values({
          userId: user.id,
          type: "withdrawal",
          amount,
          currency: "XAF",
          status: "pending",
          reference: txRef("WD"),
          label: "Retrait Mobile Money",
          operator: input.operator,
          destination: phone,
          meta: { countryCode: input.countryCode ?? user.countryCode },
        })
        .returning();
      return row;
    });
  }

  const usd = Math.round(input.amountUsd * 100) / 100;
  if (!Number.isFinite(usd) || usd < MIN_CRYPTO_WITHDRAWAL_USD) throw new WalletError(`Le retrait crypto minimum est de ${MIN_CRYPTO_WITHDRAWAL_USD} USD.`, 422);
  if (!input.address || input.address.trim().length < 20) throw new WalletError("Adresse de portefeuille invalide.", 422);
  const cents = Math.round(usd * 100);
  const neededXaf = Math.ceil(usd * XAF_PER_USD);

  return db.transaction(async (tx) => {
    const [locked] = await tx.select({ balance: users.balance, balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, user.id)).for("update");
    if (!locked) throw new WalletError("Utilisateur introuvable.", 404);
    // Use USD balance first, then convert from main FCFA balance.
    if (locked.balanceUsd >= cents) {
      await tx.update(users).set({ balanceUsd: sql`${users.balanceUsd} - ${cents}` }).where(eq(users.id, user.id));
    } else if (locked.balance >= neededXaf) {
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${neededXaf}`, totalWithdrawn: sql`${users.totalWithdrawn} + ${neededXaf}` })
        .where(eq(users.id, user.id));
    } else {
      throw new WalletError("Solde insuffisant pour ce retrait crypto.", 422);
    }
    const [row] = await tx
      .insert(transactions)
      .values({
        userId: user.id,
        type: "withdrawal",
        amount: cents,
        currency: "USD",
        status: "pending",
        reference: txRef("WD"),
        label: "Retrait cryptomonnaie",
        operator: input.network,
        destination: input.address.trim(),
        meta: { xafEquivalent: neededXaf, requiresAdminApproval: true },
      })
      .returning();
    return row;
  });
}

export async function listWithdrawals(userId: string, limit = 20) {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.type, "withdrawal")))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function listTransactions(userId: string, limit = 50) {
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit);
}

/* ------------------------------------------------------------------ */
/* Withdrawal accounts                                                 */
/* ------------------------------------------------------------------ */

export async function listAccounts(userId: string) {
  return db.select().from(withdrawalAccounts).where(eq(withdrawalAccounts.userId, userId)).orderBy(desc(withdrawalAccounts.isDefault), desc(withdrawalAccounts.createdAt));
}

export async function addAccount(userId: string, data: { operator: string; countryCode: string; phone: string; holderName?: string }) {
  const phone = data.phone.replace(/[^\d]/g, "");
  if (phone.length < 8) throw new WalletError("Numéro invalide.", 422);
  const existing = await listAccounts(userId);
  const [row] = await db
    .insert(withdrawalAccounts)
    .values({ userId, operator: data.operator, countryCode: data.countryCode, phone, holderName: data.holderName || null, isDefault: existing.length === 0 })
    .returning();
  return row;
}

export async function setDefaultAccount(userId: string, id: string) {
  await db.transaction(async (tx) => {
    await tx.update(withdrawalAccounts).set({ isDefault: false }).where(eq(withdrawalAccounts.userId, userId));
    await tx.update(withdrawalAccounts).set({ isDefault: true }).where(and(eq(withdrawalAccounts.userId, userId), eq(withdrawalAccounts.id, id)));
  });
}

export async function deleteAccount(userId: string, id: string) {
  await db.delete(withdrawalAccounts).where(and(eq(withdrawalAccounts.userId, userId), eq(withdrawalAccounts.id, id)));
}

/* ------------------------------------------------------------------ */
/* Leaderboard & chart                                                 */
/* ------------------------------------------------------------------ */

export type LeaderEntry = { id: string; name: string; countryCode: string; avatarUrl: string | null; sales: number; rank: number; tier: string };

export function tierFor(sales: number, rank: number) {
  if (rank === 1 && sales > 0) return "LEADER ÉLITE";
  if (sales >= 30) return "LEADER ÉLITE";
  if (sales >= 10) return "LEADER GOLD";
  if (sales > 0) return "LEADER GOLD";
  return "NON CLASSÉ";
}

export async function monthlyLeaderboard(limit = 3): Promise<LeaderEntry[]> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const rows = await db
    .select({ code: users.referredBy, sales: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.status, "active"), gte(users.activatedAt, start), sql`${users.referredBy} is not null`))
    .groupBy(users.referredBy)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  if (!rows.length) return [];
  const sponsors = await db
    .select({ id: users.id, name: users.name, countryCode: users.countryCode, avatarUrl: users.avatarUrl, referralCode: users.referralCode })
    .from(users)
    .where(sql`${users.referralCode} in (${sql.join(rows.map((r) => sql`${r.code}`), sql`, `)})`);
  return rows
    .map((r, i) => {
      const s = sponsors.find((x) => x.referralCode === r.code);
      if (!s) return null;
      return { id: s.id, name: s.name, countryCode: s.countryCode, avatarUrl: s.avatarUrl, sales: r.sales, rank: i + 1, tier: tierFor(r.sales, i + 1) };
    })
    .filter((x): x is LeaderEntry => !!x);
}

export async function mySalesThisMonth(user: User) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.referredBy, user.referralCode), eq(users.status, "active"), gte(users.activatedAt, start)));
  return r?.n ?? 0;
}

export type ChartPoint = { label: string; deposits: number; withdrawals: number; commissions: number; revenue: number; ads: number; net: number };

export async function chartSeries(userId: string, range: "week" | "month" | "year"): Promise<ChartPoint[]> {
  const now = new Date();
  const buckets: { key: string; label: string; from: Date; to: Date }[] = [];
  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const to = new Date(d);
      to.setDate(d.getDate() + 1);
      buckets.push({ key: d.toISOString(), label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, from: d, to });
    }
  } else if (range === "month") {
    for (let i = 3; i >= 0; i--) {
      const to = new Date(now);
      to.setDate(now.getDate() - i * 7 + 1);
      to.setHours(0, 0, 0, 0);
      const from = new Date(to);
      from.setDate(to.getDate() - 7);
      buckets.push({ key: from.toISOString(), label: `S${4 - i}`, from, to });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ key: from.toISOString(), label: from.toLocaleDateString("fr-FR", { month: "short" }), from, to });
    }
  }
  const since = buckets[0].from;
  const rows = await db
    .select({ type: transactions.type, amount: transactions.amount, currency: transactions.currency, createdAt: transactions.createdAt })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, since)));

  return buckets.map((b) => {
    const p: ChartPoint = { label: b.label, deposits: 0, withdrawals: 0, commissions: 0, revenue: 0, ads: 0, net: 0 };
    for (const r of rows) {
      if (r.createdAt < b.from || r.createdAt >= b.to) continue;
      const amt = r.currency === "USD" ? Math.round((r.amount / 100) * XAF_PER_USD) : r.amount;
      if (r.type === "deposit") p.deposits += amt;
      else if (r.type === "withdrawal") p.withdrawals += amt;
      else if (r.type === "commission") p.commissions += amt;
      else if (r.type === "revenue") p.revenue += amt;
      else if (r.type === "ads") p.ads += amt;
    }
    p.net = p.deposits + p.commissions + p.revenue + p.ads - p.withdrawals;
    return p;
  });
}

export async function adsTotal(userId: string) {
  const [r] = await db
    .select({ s: sql<number>`coalesce(sum(${transactions.amount}),0)::int` })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), eq(transactions.type, "ads")));
  return r?.s ?? 0;
}
