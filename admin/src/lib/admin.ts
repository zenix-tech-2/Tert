import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, adPublicationDays, adPublications, catalogItems, contacts, payments, smmOrders, supportMessages, transactions, users, withdrawalAccounts } from "@/db/schema";

const PUBLISHER_PER_VIEW = Number(process.env.DBI_ADS_PUBLISHER_PER_VIEW || 1.8);
const REFERRAL_COMMISSION = Number(process.env.DBI_REFERRAL_COMMISSION || 1000);
export const ref = (p = "AD") => `${p}${randomBytes(4).toString("hex").toUpperCase()}`;

export class AdminError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

/* ---------------- Stats ---------------- */
export async function overview() {
  const since = new Date(Date.now() - 30 * 86400000);
  const [[u], [a], [pw], [pc], [pd], [rev], [dep], [sm], [oc]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "member")),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, "member"), eq(users.status, "active"))),
    db.select({ n: sql<number>`count(*)::int`, s: sql<number>`coalesce(sum(case when currency='XAF' then amount else 0 end),0)::int` }).from(transactions).where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "pending"))),
    db.select({ n: sql<number>`count(*)::int` }).from(adCampaigns).where(eq(adCampaigns.status, "pending")),
    db.select({ n: sql<number>`count(*)::int` }).from(adPublicationDays).where(eq(adPublicationDays.status, "submitted")),
    db.select({ s: sql<number>`coalesce(sum(amount),0)::int` }).from(transactions).where(and(eq(transactions.type, "activation"), gte(transactions.createdAt, since))),
    db.select({ s: sql<number>`coalesce(sum(amount),0)::int` }).from(transactions).where(and(eq(transactions.type, "deposit"), gte(transactions.createdAt, since))),
    db.select({ n: sql<number>`count(*)::int` }).from(supportMessages).where(and(eq(supportMessages.sender, "user"), isNull(supportMessages.readAt))),
    db.select({ n: sql<number>`count(*)::int` }).from(smmOrders).where(inArray(smmOrders.status, ["pending", "in_progress", "processing"])),
  ]);
  const recentUsers = await db.select({ id: users.id, name: users.name, email: users.email, status: users.status, countryCode: users.countryCode, createdAt: users.createdAt }).from(users).where(eq(users.role, "member")).orderBy(desc(users.createdAt)).limit(8);
  const recentTx = await db.select({ t: transactions, name: users.name }).from(transactions).innerJoin(users, eq(transactions.userId, users.id)).orderBy(desc(transactions.createdAt)).limit(10);
  // signups last 14 days
  const days = await db.select({ d: sql<string>`to_char(date_trunc('day', ${users.createdAt}), 'DD/MM')`, n: sql<number>`count(*)::int`, a: sql<number>`sum(case when status='active' then 1 else 0 end)::int` }).from(users).where(gte(users.createdAt, new Date(Date.now() - 14 * 86400000))).groupBy(sql`date_trunc('day', ${users.createdAt})`).orderBy(sql`date_trunc('day', ${users.createdAt})`);
  return { members: u.n, active: a.n, pendingWithdrawals: pw.n, pendingWithdrawalsAmount: pw.s, pendingCampaigns: pc.n, pendingDays: pd.n, activationRevenue30d: rev.s, deposits30d: dep.s, unreadSupport: sm.n, openSmm: oc.n, recentUsers, recentTx: recentTx.map((r) => ({ ...r.t, userName: r.name })), signups: days };
}

/* ---------------- Members ---------------- */
export async function listMembers(q = "", status = "all", page = 1, limit = 30) {
  const where = [eq(users.role, "member")];
  if (status !== "all") where.push(eq(users.status, status));
  if (q) where.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`), ilike(users.whatsapp, `%${q}%`), ilike(users.matricule, `%${q}%`), ilike(users.referralCode, `%${q}%`))!);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(...where));
  const items = await db.select({ id: users.id, name: users.name, email: users.email, whatsapp: users.whatsapp, countryCode: users.countryCode, status: users.status, matricule: users.matricule, referralCode: users.referralCode, referredBy: users.referredBy, balance: users.balance, gains: users.gains, balanceUsd: users.balanceUsd, createdAt: users.createdAt, activatedAt: users.activatedAt }).from(users).where(and(...where)).orderBy(desc(users.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items, total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}

export async function getMember(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) throw new AdminError("Membre introuvable.", 404);
  const [tx, pays, accounts, [refs]] = await Promise.all([
    db.select().from(transactions).where(eq(transactions.userId, id)).orderBy(desc(transactions.createdAt)).limit(50),
    db.select().from(payments).where(eq(payments.userId, id)).orderBy(desc(payments.createdAt)).limit(20),
    db.select().from(withdrawalAccounts).where(eq(withdrawalAccounts.userId, id)),
    db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.referredBy, u.referralCode)),
  ]);
  const { passwordHash: _p, ...safe } = u;
  return { user: safe, transactions: tx, payments: pays, accounts, referrals: refs.n };
}

export async function activateMember(id: string, adminId: string) {
  const rows = await db.update(users).set({ status: "active", activatedAt: new Date() }).where(and(eq(users.id, id), eq(users.status, "pending"))).returning({ id: users.id, name: users.name, referredBy: users.referredBy });
  if (!rows.length) throw new AdminError("Déjà actif ou introuvable.", 409);
  const u = rows[0];
  await db.insert(transactions).values({ userId: id, type: "activation", amount: 0, currency: "XAF", status: "completed", reference: ref("ACT"), label: "Activation manuelle (admin)", meta: { adminId } });
  if (u.referredBy) {
    const [s] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, u.referredBy)).limit(1);
    if (s) {
      await db.update(users).set({ gains: sql`${users.gains} + ${REFERRAL_COMMISSION}` }).where(eq(users.id, s.id));
      await db.insert(transactions).values({ userId: s.id, type: "commission", amount: REFERRAL_COMMISSION, currency: "XAF", status: "completed", reference: ref("CM"), label: `Commission parrainage – ${u.name}`, meta: { referredUserId: id } });
    }
  }
}

export async function adjustBalance(id: string, field: "balance" | "gains" | "balanceUsd" | "feuilles", delta: number, note: string, adminId: string) {
  if (!Number.isFinite(delta) || delta === 0) throw new AdminError("Montant invalide.", 422);
  await db.transaction(async (tx) => {
    const col = { balance: users.balance, gains: users.gains, balanceUsd: users.balanceUsd, feuilles: users.feuilles }[field];
    const [u] = await tx.update(users).set({ [field]: sql`${col} + ${delta}` }).where(eq(users.id, id)).returning({ v: col });
    if (!u) throw new AdminError("Membre introuvable.", 404);
    if (u.v < 0) throw new AdminError("Le solde ne peut pas devenir négatif.", 422);
    if (field !== "feuilles") {
      await tx.insert(transactions).values({ userId: id, type: delta > 0 ? (field === "gains" ? "revenue" : "deposit") : "withdrawal", amount: Math.abs(delta), currency: field === "balanceUsd" ? "USD" : "XAF", status: "completed", reference: ref("ADJ"), label: note || "Ajustement administrateur", meta: { adminId, field, delta } });
    }
  });
}

export async function setRole(id: string, role: "member" | "admin") {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function resetPassword(id: string, hash: string) {
  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, id));
}

/* ---------------- Withdrawals ---------------- */
export async function listWithdrawals(status = "pending", page = 1, limit = 30) {
  const where = [eq(transactions.type, "withdrawal")];
  if (status !== "all") where.push(eq(transactions.status, status));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(transactions).where(and(...where));
  const rows = await db.select({ t: transactions, name: users.name, email: users.email, whatsapp: users.whatsapp, balance: users.balance }).from(transactions).innerJoin(users, eq(transactions.userId, users.id)).where(and(...where)).orderBy(desc(transactions.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items: rows.map((r) => ({ ...r.t, userName: r.name, userEmail: r.email, userWhatsapp: r.whatsapp, userBalance: r.balance })), total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}

export async function decideWithdrawal(id: string, decision: "approved" | "completed" | "rejected", note: string, adminId: string) {
  await db.transaction(async (tx) => {
    const [t] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.type, "withdrawal"))).for("update");
    if (!t) throw new AdminError("Retrait introuvable.", 404);
    if (["completed", "rejected"].includes(t.status)) throw new AdminError("Retrait déjà traité.", 409);
    await tx.update(transactions).set({ status: decision, meta: { ...t.meta, adminId, note, decidedAt: new Date().toISOString() } }).where(eq(transactions.id, id));
    if (decision === "rejected") {
      // refund the amount (XAF) or the USD / XAF equivalent for crypto
      if (t.currency === "USD") {
        const xaf = Number(t.meta?.xafEquivalent ?? 0);
        if (xaf > 0) await tx.update(users).set({ balance: sql`${users.balance} + ${xaf}`, totalWithdrawn: sql`greatest(${users.totalWithdrawn} - ${xaf}, 0)` }).where(eq(users.id, t.userId));
        else await tx.update(users).set({ balanceUsd: sql`${users.balanceUsd} + ${t.amount}` }).where(eq(users.id, t.userId));
      } else {
        await tx.update(users).set({ balance: sql`${users.balance} + ${t.amount}`, totalWithdrawn: sql`greatest(${users.totalWithdrawn} - ${t.amount}, 0)` }).where(eq(users.id, t.userId));
      }
      await tx.insert(transactions).values({ userId: t.userId, type: "deposit", amount: t.currency === "USD" ? Number(t.meta?.xafEquivalent ?? 0) || t.amount : t.amount, currency: t.currency === "USD" && !t.meta?.xafEquivalent ? "USD" : "XAF", status: "completed", reference: ref("RF"), label: `Retrait rejeté – remboursement${note ? ` (${note})` : ""}`, meta: { withdrawalId: id } });
    }
  });
}

/* ---------------- Payments ---------------- */
export async function listPayments(status = "all", page = 1, limit = 30) {
  const where = status === "all" ? undefined : eq(payments.status, status);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(where);
  const rows = await db.select({ p: payments, name: users.name, email: users.email }).from(payments).innerJoin(users, eq(payments.userId, users.id)).where(where).orderBy(desc(payments.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items: rows.map((r) => ({ ...r.p, userName: r.name, userEmail: r.email })), total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}

/** Manually mark a payment successful (e.g. confirmed on the AshTechPay dashboard). */
export async function confirmPayment(id: string, adminId: string) {
  await db.transaction(async (tx) => {
    const [p] = await tx.select().from(payments).where(eq(payments.id, id)).for("update");
    if (!p) throw new AdminError("Paiement introuvable.", 404);
    if (p.status === "success") throw new AdminError("Déjà confirmé.", 409);
    await tx.update(payments).set({ status: "success", updatedAt: new Date(), details: { ...p.details, manualConfirmBy: adminId } }).where(eq(payments.id, id));
    if (p.purpose === "deposit") {
      await tx.update(users).set({ balance: sql`${users.balance} + ${p.creditAmount}` }).where(eq(users.id, p.userId));
      await tx.insert(transactions).values({ userId: p.userId, type: "deposit", amount: p.creditAmount, currency: "XAF", status: "completed", reference: ref("DP"), label: "Dépôt confirmé (admin)", meta: { paymentId: id } });
    }
  });
  const [p] = await db.select({ purpose: payments.purpose, userId: payments.userId }).from(payments).where(eq(payments.id, id));
  if (p?.purpose === "activation") await activateMember(p.userId, adminId).catch(() => {});
}

/* ---------------- Ads ---------------- */
export async function listCampaigns(status = "pending") {
  const where = status === "all" ? undefined : eq(adCampaigns.status, status);
  const rows = await db.select({ c: adCampaigns, name: users.name, email: users.email }).from(adCampaigns).innerJoin(users, eq(adCampaigns.advertiserId, users.id)).where(where).orderBy(desc(adCampaigns.createdAt)).limit(100);
  return rows.map((r) => ({ ...r.c, advertiserName: r.name, advertiserEmail: r.email }));
}

export async function decideCampaign(id: string, decision: "active" | "rejected" | "completed", adminId: string) {
  await db.transaction(async (tx) => {
    const [c] = await tx.select().from(adCampaigns).where(eq(adCampaigns.id, id)).for("update");
    if (!c) throw new AdminError("Campagne introuvable.", 404);
    const now = new Date();
    await tx.update(adCampaigns).set({ status: decision, startsAt: decision === "active" ? now : c.startsAt, endsAt: decision === "active" ? new Date(now.getTime() + (c.days + c.bonusDays) * 86400000) : c.endsAt }).where(eq(adCampaigns.id, id));
    if (decision === "rejected" && c.status === "pending" && c.budgetXaf > 0) {
      await tx.update(users).set({ balance: sql`${users.balance} + ${c.budgetXaf}` }).where(eq(users.id, c.advertiserId));
      await tx.insert(transactions).values({ userId: c.advertiserId, type: "deposit", amount: c.budgetXaf, currency: "XAF", status: "completed", reference: ref("RF"), label: `Campagne rejetée – remboursement : ${c.title}`, meta: { campaignId: id, adminId } });
    }
  });
}

export async function listSubmittedDays() {
  return db
    .select({ d: adPublicationDays, p: adPublications, title: adCampaigns.title, isTest: adCampaigns.isTest, publisher: users.name, publisherEmail: users.email })
    .from(adPublicationDays)
    .innerJoin(adPublications, eq(adPublicationDays.publicationId, adPublications.id))
    .innerJoin(adCampaigns, eq(adPublications.campaignId, adCampaigns.id))
    .innerJoin(users, eq(adPublications.publisherId, users.id))
    .where(eq(adPublicationDays.status, "submitted"))
    .orderBy(asc(adPublicationDays.createdAt))
    .limit(100);
}

export async function verifyDay(dayId: string, verifiedViews: number, approve: boolean) {
  const [d] = await db.select().from(adPublicationDays).where(eq(adPublicationDays.id, dayId)).limit(1);
  if (!d) throw new AdminError("Jour introuvable.", 404);
  const [p] = await db.select().from(adPublications).where(eq(adPublications.id, d.publicationId)).limit(1);
  if (!p) throw new AdminError("Publication introuvable.", 404);
  const [c] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, p.campaignId)).limit(1);
  const pay = approve ? Math.floor(verifiedViews * PUBLISHER_PER_VIEW) : 0;
  await db.transaction(async (tx) => {
    await tx.update(adPublicationDays).set({ status: approve ? "verified" : "rejected", verifiedViews: approve ? verifiedViews : 0 }).where(eq(adPublicationDays.id, dayId));
    await tx.update(adPublications).set({ verifiedViews: sql`${adPublications.verifiedViews} + ${approve ? verifiedViews : 0}`, earned: sql`${adPublications.earned} + ${pay}` }).where(eq(adPublications.id, p.id));
    if (pay > 0) {
      await tx.update(users).set({ gains: sql`${users.gains} + ${pay}` }).where(eq(users.id, p.publisherId));
      await tx.insert(transactions).values({ userId: p.publisherId, type: "revenue", amount: pay, currency: "XAF", status: "completed", reference: ref("VW"), label: `Vues validées – jour ${d.day}`, meta: { publicationId: p.id, verifiedViews } });
      await tx.update(adCampaigns).set({ views: sql`${adCampaigns.views} + ${verifiedViews}` }).where(eq(adCampaigns.id, p.campaignId));
    }
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(adPublicationDays).where(and(eq(adPublicationDays.publicationId, p.id), inArray(adPublicationDays.status, ["verified", "rejected"])));
    if (c && n >= c.days) await tx.update(adPublications).set({ status: "completed" }).where(eq(adPublications.id, p.id));
  });
}

/* ---------------- Catalog ---------------- */
export async function listCatalog(kind = "all") {
  const where = kind === "all" ? undefined : eq(catalogItems.kind, kind);
  const rows = await db.select({ i: catalogItems, seller: users.name, sales: sql<number>`(select count(*) from purchases where purchases.item_id = ${catalogItems.id})::int` }).from(catalogItems).leftJoin(users, eq(catalogItems.sellerId, users.id)).where(where).orderBy(desc(catalogItems.createdAt)).limit(300);
  return rows.map((r) => ({ ...r.i, sellerName: r.seller, sales: r.sales }));
}
export type CatalogInput = { kind: string; title: string; description: string; category: string; price: number; promo: boolean; coverUrl?: string | null; durationLabel?: string | null; format?: string | null; accessUrl?: string | null; status?: string };
export async function upsertCatalog(input: CatalogInput, id?: string) {
  const values = { kind: input.kind, title: input.title, description: input.description, category: input.category, price: input.price, promo: input.promo, coverUrl: input.coverUrl || null, durationLabel: input.durationLabel || null, format: input.format || null, accessUrl: input.accessUrl || null, status: input.status || "published" };
  if (id) { const [r] = await db.update(catalogItems).set(values).where(eq(catalogItems.id, id)).returning(); return r; }
  const [r] = await db.insert(catalogItems).values(values).returning();
  return r;
}
export async function deleteCatalog(id: string) { await db.update(catalogItems).set({ status: "archived" }).where(eq(catalogItems.id, id)); }

/* ---------------- Contacts ---------------- */
export async function listContactsAdmin(q = "", page = 1, limit = 50) {
  const where = q ? or(ilike(contacts.name, `%${q}%`), ilike(contacts.phone, `%${q}%`), ilike(contacts.city, `%${q}%`)) : undefined;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contacts).where(where);
  const items = await db.select().from(contacts).where(where).orderBy(desc(contacts.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items, total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}
export async function importContacts(rows: { name: string; phone: string; countryCode: string; countryName: string; city?: string; age?: number; profession?: string; gender?: string }[]) {
  const clean = rows.filter((r) => r.name && r.phone && r.countryCode).map((r) => ({ ...r, phone: r.phone.replace(/[^\d+]/g, ""), countryCode: r.countryCode.toUpperCase().slice(0, 2), age: r.age || null, city: r.city || null, profession: r.profession || null, gender: r.gender || null }));
  if (!clean.length) return 0;
  const res = await db.insert(contacts).values(clean).onConflictDoNothing().returning({ id: contacts.id });
  return res.length;
}
export async function deleteContact(id: string) { await db.delete(contacts).where(eq(contacts.id, id)); }

/* ---------------- Support ---------------- */
export async function supportInbox() {
  const rows = await db.execute(sql`
    select u.id, u.name, u.email, u.whatsapp,
      (select body from support_messages m where m.user_id = u.id order by created_at desc limit 1) as last_body,
      (select created_at from support_messages m where m.user_id = u.id order by created_at desc limit 1) as last_at,
      (select count(*) from support_messages m where m.user_id = u.id and m.sender = 'user' and m.read_at is null)::int as unread
    from users u where exists (select 1 from support_messages m where m.user_id = u.id)
    order by last_at desc limit 200`);
  return rows.rows as { id: string; name: string; email: string; whatsapp: string; last_body: string; last_at: string; unread: number }[];
}
export async function supportThread(userId: string) {
  const items = await db.select().from(supportMessages).where(eq(supportMessages.userId, userId)).orderBy(asc(supportMessages.createdAt)).limit(500);
  await db.update(supportMessages).set({ readAt: new Date() }).where(and(eq(supportMessages.userId, userId), eq(supportMessages.sender, "user"), isNull(supportMessages.readAt)));
  const [u] = await db.select({ id: users.id, name: users.name, email: users.email, whatsapp: users.whatsapp, matricule: users.matricule, status: users.status }).from(users).where(eq(users.id, userId));
  return { items, user: u };
}
export async function supportReply(userId: string, body: string, attachmentUrl?: string, attachmentType?: string) {
  const [m] = await db.insert(supportMessages).values({ userId, sender: "support", body, attachmentUrl: attachmentUrl || null, attachmentType: attachmentType || null, readAt: new Date() }).returning();
  return m;
}

/* ---------------- SMM ---------------- */
export async function listSmmOrders(status = "all", page = 1, limit = 50) {
  const where = status === "all" ? undefined : eq(smmOrders.status, status);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(smmOrders).where(where);
  const rows = await db.select({ o: smmOrders, name: users.name, email: users.email }).from(smmOrders).innerJoin(users, eq(smmOrders.userId, users.id)).where(where).orderBy(desc(smmOrders.createdAt)).limit(limit).offset((page - 1) * limit);
  const [agg] = await db.select({ revenue: sql<number>`coalesce(sum(price_xaf),0)::int`, cost: sql<number>`coalesce(sum(cost_usd),0)::int` }).from(smmOrders).where(inArray(smmOrders.status, ["completed", "in_progress", "processing", "partial"]));
  return { items: rows.map((r) => ({ ...r.o, userName: r.name, userEmail: r.email })), total: n, page, pages: Math.max(1, Math.ceil(n / limit)), revenueXaf: agg.revenue, costUsdCents: agg.cost };
}

export async function smmProviderBalances() {
  const providers = [
    { id: "peakerr", label: "Peakerr", key: process.env.PEAKERR_API_KEY, url: process.env.PEAKERR_API_URL || "https://peakerr.com/api/v2" },
    { id: "smmafrica", label: "SMM Africa", key: process.env.SMMAFRICA_API_KEY, url: process.env.SMMAFRICA_API_URL || "https://smm.africa/api/v3" },
  ];
  return Promise.all(
    providers.map(async (p) => {
      if (!p.key) return { ...p, key: undefined, configured: false, balance: null as string | null, currency: null as string | null };
      try {
        const r = await fetch(p.url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key: p.key, action: "balance" }), cache: "no-store", signal: AbortSignal.timeout(10000) });
        const d = (await r.json()) as { balance?: string; currency?: string };
        return { ...p, key: undefined, configured: true, balance: d.balance ?? null, currency: d.currency ?? null };
      } catch {
        return { ...p, key: undefined, configured: true, balance: null, currency: null };
      }
    }),
  );
}

/* ---------------- Transactions ---------------- */
export async function listTransactionsAdmin(type = "all", page = 1, limit = 50) {
  const where = type === "all" ? undefined : eq(transactions.type, type);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(transactions).where(where);
  const rows = await db.select({ t: transactions, name: users.name }).from(transactions).innerJoin(users, eq(transactions.userId, users.id)).where(where).orderBy(desc(transactions.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items: rows.map((r) => ({ ...r.t, userName: r.name })), total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}
