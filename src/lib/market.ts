import "server-only";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { catalogItems, contactDownloads, contacts, purchases, transactions, users, vendorSubscriptions, type User } from "@/db/schema";
import { txRef, WalletError } from "./wallet";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export const CONVERSION_RATE = Number(process.env.DBI_CONVERSION_RATE || 600); // XAF per 1 USD, no fee
export const TRANSFER_FEE_PCT = Number(process.env.DBI_TRANSFER_FEE_PCT || 10);
export const TRANSFER_MIN = Number(process.env.DBI_TRANSFER_MIN || 0);
export const VENDOR = {
  publishPrice: Number(process.env.DBI_VENDOR_PUBLISH_PRICE || 0),
  editPrice: Number(process.env.DBI_VENDOR_EDIT_PRICE || 990),
  shopFee: Number(process.env.DBI_VENDOR_SHOP_FEE || 990),
  subscription: Number(process.env.DBI_VENDOR_SUBSCRIPTION || 10000),
};
export const PAGE_SIZE = 12;

/* ------------------------------------------------------------------ */
/* Wallet conversion                                                   */
/* ------------------------------------------------------------------ */

export async function convert(user: User, direction: "usd_to_xaf" | "xaf_to_usd", amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) throw new WalletError("Montant invalide.", 422);
  return db.transaction(async (tx) => {
    const [u] = await tx.select({ balance: users.balance, balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, user.id)).for("update");
    if (!u) throw new WalletError("Utilisateur introuvable.", 404);
    if (direction === "usd_to_xaf") {
      const cents = Math.round(amount * 100);
      if (cents > u.balanceUsd) throw new WalletError("Solde USD insuffisant.", 422);
      const xaf = Math.floor(amount * CONVERSION_RATE);
      await tx.update(users).set({ balanceUsd: sql`${users.balanceUsd} - ${cents}`, balance: sql`${users.balance} + ${xaf}` }).where(eq(users.id, user.id));
      const [row] = await tx
        .insert(transactions)
        .values({ userId: user.id, type: "conversion", amount: xaf, currency: "XAF", status: "completed", reference: txRef("CV"), label: `Conversion ${amount} USD → ${xaf} XAF`, meta: { direction, from: amount, fromCurrency: "USD", to: xaf, toCurrency: "XAF", rate: CONVERSION_RATE } })
        .returning();
      return row;
    }
    const xaf = Math.floor(amount);
    if (xaf > u.balance) throw new WalletError("Solde principal insuffisant.", 422);
    const cents = Math.floor((xaf / CONVERSION_RATE) * 100);
    if (cents <= 0) throw new WalletError("Montant trop faible pour la conversion.", 422);
    await tx.update(users).set({ balance: sql`${users.balance} - ${xaf}`, balanceUsd: sql`${users.balanceUsd} + ${cents}` }).where(eq(users.id, user.id));
    const [row] = await tx
      .insert(transactions)
      .values({ userId: user.id, type: "conversion", amount: cents, currency: "USD", status: "completed", reference: txRef("CV"), label: `Conversion ${xaf} XAF → ${(cents / 100).toFixed(2)} USD`, meta: { direction, from: xaf, fromCurrency: "XAF", to: cents / 100, toCurrency: "USD", rate: CONVERSION_RATE } })
      .returning();
    return row;
  });
}

export async function listConversions(userId: string, limit = 10) {
  return db.select().from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "conversion"))).orderBy(desc(transactions.createdAt)).limit(limit);
}

/* ------------------------------------------------------------------ */
/* Member transfer                                                     */
/* ------------------------------------------------------------------ */

export function estimateTransfer(amount: number) {
  const fee = Math.ceil((amount * TRANSFER_FEE_PCT) / 100);
  return { amount, fee, total: amount + fee, feePct: TRANSFER_FEE_PCT };
}

export async function findMember(matricule: string) {
  const [m] = await db.select({ id: users.id, name: users.name, matricule: users.matricule, countryCode: users.countryCode, status: users.status }).from(users).where(eq(users.matricule, matricule.trim().toUpperCase())).limit(1);
  return m ?? null;
}

export async function transferToMember(sender: User, matricule: string, amount: number) {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value <= 0) throw new WalletError("Montant invalide.", 422);
  if (value < TRANSFER_MIN) throw new WalletError(`Le transfert minimum est de ${TRANSFER_MIN} XAF.`, 422);
  const recipient = await findMember(matricule);
  if (!recipient) throw new WalletError("Aucun membre avec ce matricule.", 404);
  if (recipient.id === sender.id) throw new WalletError("Vous ne pouvez pas vous transférer à vous-même.", 422);
  if (recipient.status !== "active") throw new WalletError("Le destinataire n'a pas encore activé son compte.", 422);
  const { fee, total } = estimateTransfer(value);

  return db.transaction(async (tx) => {
    const [s] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, sender.id)).for("update");
    if (!s || s.balance < total) throw new WalletError(`Solde insuffisant (montant + frais = ${total} XAF).`, 422);
    await tx.update(users).set({ balance: sql`${users.balance} - ${total}` }).where(eq(users.id, sender.id));
    await tx.update(users).set({ balance: sql`${users.balance} + ${value}` }).where(eq(users.id, recipient.id));
    const ref = txRef("TF");
    const [out] = await tx
      .insert(transactions)
      .values({ userId: sender.id, type: "transfer_out", amount: total, currency: "XAF", status: "completed", reference: ref, label: `Transfert DBI vers ${recipient.name}`, destination: recipient.matricule, meta: { fee, net: value, recipientId: recipient.id } })
      .returning();
    await tx.insert(transactions).values({ userId: recipient.id, type: "transfer_in", amount: value, currency: "XAF", status: "completed", reference: ref, label: `Transfert DBI reçu de ${sender.name}`, destination: sender.matricule, meta: { senderId: sender.id } });
    return { transaction: out, recipient: { name: recipient.name, matricule: recipient.matricule }, fee, net: value, total };
  });
}

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export type CatalogQuery = {
  kind: "formation" | "ebook" | "product";
  q?: string;
  category?: string;
  sort?: "recent" | "price_asc" | "price_desc" | "popular";
  min?: number;
  max?: number;
  type?: "free" | "paid" | "promo";
  page?: number;
};

export async function listCatalog(query: CatalogQuery, userId?: string) {
  const where: SQL[] = [eq(catalogItems.kind, query.kind), eq(catalogItems.status, "published")];
  if (query.q) where.push(or(ilike(catalogItems.title, `%${query.q}%`), ilike(catalogItems.description, `%${query.q}%`))!);
  if (query.category && query.category !== "all") where.push(eq(catalogItems.category, query.category));
  if (query.min !== undefined) where.push(gte(catalogItems.price, query.min));
  if (query.max !== undefined) where.push(lte(catalogItems.price, query.max));
  if (query.type === "free") where.push(eq(catalogItems.price, 0));
  if (query.type === "paid") where.push(sql`${catalogItems.price} > 0`);
  if (query.type === "promo") where.push(eq(catalogItems.promo, true));

  const order =
    query.sort === "price_asc" ? asc(catalogItems.price) : query.sort === "price_desc" ? desc(catalogItems.price) : query.sort === "popular" ? desc(catalogItems.ratingCount) : desc(catalogItems.createdAt);
  const page = Math.max(1, query.page ?? 1);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(catalogItems).where(and(...where));
  const rows = await db
    .select({ item: catalogItems, seller: users.name })
    .from(catalogItems)
    .leftJoin(users, eq(catalogItems.sellerId, users.id))
    .where(and(...where))
    .orderBy(order)
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  let owned = new Set<string>();
  if (userId && rows.length) {
    const ids = rows.map((r) => r.item.id);
    const p = await db.select({ itemId: purchases.itemId }).from(purchases).where(and(eq(purchases.userId, userId), sql`${purchases.itemId} in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`));
    owned = new Set(p.map((x) => x.itemId));
  }
  const cats = await db.selectDistinct({ c: catalogItems.category }).from(catalogItems).where(and(eq(catalogItems.kind, query.kind), eq(catalogItems.status, "published")));
  return {
    items: rows.map((r) => ({ ...r.item, sellerName: r.seller ?? "DBI Academy", owned: owned.has(r.item.id), accessUrl: owned.has(r.item.id) || r.item.price === 0 ? r.item.accessUrl : null })),
    total: n,
    page,
    pages: Math.max(1, Math.ceil(n / PAGE_SIZE)),
    categories: cats.map((c) => c.c).sort(),
  };
}

export async function acquireItem(user: User, itemId: string) {
  const [item] = await db.select().from(catalogItems).where(and(eq(catalogItems.id, itemId), eq(catalogItems.status, "published"))).limit(1);
  if (!item) throw new WalletError("Produit introuvable.", 404);
  const [existing] = await db.select({ id: purchases.id }).from(purchases).where(and(eq(purchases.userId, user.id), eq(purchases.itemId, itemId))).limit(1);
  if (existing) return { item, alreadyOwned: true };

  await db.transaction(async (tx) => {
    if (item.price > 0) {
      const [u] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
      if (!u || u.balance < item.price) throw new WalletError("Solde insuffisant. Rechargez votre compte pour acheter ce produit.", 422);
      await tx.update(users).set({ balance: sql`${users.balance} - ${item.price}` }).where(eq(users.id, user.id));
      await tx.insert(transactions).values({ userId: user.id, type: "purchase", amount: item.price, currency: "XAF", status: "completed", reference: txRef("PU"), label: `Achat : ${item.title}`, meta: { itemId: item.id, kind: item.kind } });
      if (item.sellerId) {
        const sellerShare = Math.floor(item.price * 0.9);
        await tx.update(users).set({ gains: sql`${users.gains} + ${sellerShare}` }).where(eq(users.id, item.sellerId));
        await tx.insert(transactions).values({ userId: item.sellerId, type: "revenue", amount: sellerShare, currency: "XAF", status: "completed", reference: txRef("SL"), label: `Vente : ${item.title}`, meta: { itemId: item.id, buyerId: user.id } });
      }
    }
    await tx.insert(purchases).values({ userId: user.id, itemId: item.id, pricePaid: item.price });
    await tx.update(catalogItems).set({ ratingCount: sql`${catalogItems.ratingCount} + 1` }).where(eq(catalogItems.id, item.id));
  });
  return { item, alreadyOwned: false };
}

export async function listLibrary(userId: string) {
  const rows = await db.select({ item: catalogItems, purchasedAt: purchases.createdAt, pricePaid: purchases.pricePaid }).from(purchases).innerJoin(catalogItems, eq(purchases.itemId, catalogItems.id)).where(eq(purchases.userId, userId)).orderBy(desc(purchases.createdAt));
  return rows.map((r) => ({ ...r.item, purchasedAt: r.purchasedAt, pricePaid: r.pricePaid }));
}

/* ------------------------------------------------------------------ */
/* Vendor                                                              */
/* ------------------------------------------------------------------ */

export async function vendorStatus(userId: string) {
  const [sub] = await db.select().from(vendorSubscriptions).where(and(eq(vendorSubscriptions.userId, userId), gte(vendorSubscriptions.expiresAt, new Date()))).orderBy(desc(vendorSubscriptions.expiresAt)).limit(1);
  const products = await db.select({ item: catalogItems, sales: sql<number>`(select count(*) from ${purchases} where ${purchases.itemId} = ${catalogItems.id})::int` }).from(catalogItems).where(eq(catalogItems.sellerId, userId)).orderBy(desc(catalogItems.createdAt));
  return { subscription: sub ?? null, products: products.map((p) => ({ ...p.item, sales: p.sales })), pricing: VENDOR };
}

export async function subscribeVendor(user: User) {
  const { subscription } = await vendorStatus(user.id);
  if (subscription) throw new WalletError("Votre souscription est déjà active.", 409);
  return db.transaction(async (tx) => {
    const [u] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
    if (!u || u.balance < VENDOR.subscription) throw new WalletError(`Solde insuffisant (${VENDOR.subscription} XAF requis).`, 422);
    await tx.update(users).set({ balance: sql`${users.balance} - ${VENDOR.subscription}` }).where(eq(users.id, user.id));
    await tx.insert(transactions).values({ userId: user.id, type: "purchase", amount: VENDOR.subscription, currency: "XAF", status: "completed", reference: txRef("VS"), label: "Souscription vendeur annuelle" });
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    const [row] = await tx.insert(vendorSubscriptions).values({ userId: user.id, amount: VENDOR.subscription, expiresAt }).returning();
    return row;
  });
}

export async function createVendorProduct(user: User, data: { title: string; description: string; category: string; price: number; promo: boolean; coverUrl?: string; accessUrl?: string; kind: "product" | "formation" | "ebook"; durationLabel?: string }) {
  const { subscription } = await vendorStatus(user.id);
  if (!subscription) throw new WalletError("Souscrivez à l'abonnement vendeur annuel pour publier.", 403);
  return db.transaction(async (tx) => {
    if (VENDOR.publishPrice > 0) {
      const [u] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
      if (!u || u.balance < VENDOR.publishPrice) throw new WalletError("Solde insuffisant pour les frais de publication.", 422);
      await tx.update(users).set({ balance: sql`${users.balance} - ${VENDOR.publishPrice}` }).where(eq(users.id, user.id));
      await tx.insert(transactions).values({ userId: user.id, type: "purchase", amount: VENDOR.publishPrice, currency: "XAF", status: "completed", reference: txRef("PB"), label: `Publication : ${data.title}` });
    }
    const [row] = await tx.insert(catalogItems).values({ ...data, sellerId: user.id, coverUrl: data.coverUrl || null, accessUrl: data.accessUrl || null, durationLabel: data.durationLabel || null, status: "published" }).returning();
    return row;
  });
}

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

export type ContactFilters = { q?: string; country?: string; city?: string; ageMin?: number; ageMax?: number; profession?: string; gender?: string; from?: string; to?: string; page?: number; limit?: number };

export async function listContacts(f: ContactFilters, excludeOwner?: string) {
  const where: SQL[] = [];
  if (f.q) where.push(or(ilike(contacts.name, `%${f.q}%`), ilike(contacts.phone, `%${f.q}%`))!);
  if (f.country && f.country !== "all") where.push(eq(contacts.countryCode, f.country));
  if (f.city) where.push(ilike(contacts.city, `%${f.city}%`));
  if (f.ageMin !== undefined) where.push(gte(contacts.age, f.ageMin));
  if (f.ageMax !== undefined) where.push(lte(contacts.age, f.ageMax));
  if (f.profession && f.profession !== "all") where.push(eq(contacts.profession, f.profession));
  if (f.gender && f.gender !== "all") where.push(eq(contacts.gender, f.gender));
  if (f.from) where.push(gte(contacts.createdAt, new Date(f.from)));
  if (f.to) {
    const d = new Date(f.to);
    d.setDate(d.getDate() + 1);
    where.push(lte(contacts.createdAt, d));
  }
  if (excludeOwner) where.push(or(sql`${contacts.ownerId} is null`, sql`${contacts.ownerId} <> ${excludeOwner}`)!);
  const cond = where.length ? and(...where) : undefined;
  const limit = Math.min(500, f.limit ?? 50);
  const page = Math.max(1, f.page ?? 1);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(contacts).where(cond);
  const items = await db.select().from(contacts).where(cond).orderBy(desc(contacts.createdAt)).limit(limit).offset((page - 1) * limit);
  return { items, total: n, page, pages: Math.max(1, Math.ceil(n / limit)) };
}

export async function contactFacets() {
  const [countries, professions] = await Promise.all([
    db.selectDistinct({ code: contacts.countryCode, name: contacts.countryName }).from(contacts),
    db.selectDistinct({ p: contacts.profession }).from(contacts).where(sql`${contacts.profession} is not null`),
  ]);
  return { countries: countries.sort((a, b) => a.name.localeCompare(b.name)), professions: professions.map((x) => x.p!).sort() };
}

export async function recordDownloads(userId: string, contactIds: string[]) {
  if (!contactIds.length) return;
  await db.insert(contactDownloads).values(contactIds.map((contactId) => ({ userId, contactId }))).onConflictDoNothing();
}

export async function whoDownloadedMe(userId: string) {
  const rows = await db
    .select({ id: contactDownloads.id, name: users.name, countryCode: users.countryCode, matricule: users.matricule, at: contactDownloads.createdAt })
    .from(contactDownloads)
    .innerJoin(contacts, eq(contactDownloads.contactId, contacts.id))
    .innerJoin(users, eq(contactDownloads.userId, users.id))
    .where(eq(contacts.ownerId, userId))
    .orderBy(desc(contactDownloads.createdAt))
    .limit(200);
  return rows;
}

/** Make sure each active member exists in the contacts directory (so others can download them). */
export async function ensureOwnContact(user: User) {
  const [existing] = await db.select({ id: contacts.id }).from(contacts).where(eq(contacts.ownerId, user.id)).limit(1);
  if (existing) return;
  const { SIGNUP_COUNTRIES } = await import("./countries");
  const name = SIGNUP_COUNTRIES.find((c) => c.code === user.countryCode)?.name ?? user.countryCode;
  await db.insert(contacts).values({ ownerId: user.id, name: user.name, phone: user.whatsapp, countryCode: user.countryCode, countryName: name });
}
