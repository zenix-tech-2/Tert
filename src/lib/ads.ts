import "server-only";
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adCampaigns, adPublicationDays, adPublications, transactions, users, type User } from "@/db/schema";
import { txRef, WalletError } from "./wallet";
import { CONVERSION_RATE } from "./market";

export const ADS = {
  costPerView: Number(process.env.DBI_ADS_COST_PER_VIEW || 3), // FCFA charged to advertiser per verified view
  publisherPerView: Number(process.env.DBI_ADS_PUBLISHER_PER_VIEW || 1.8), // FCFA paid to publisher per verified view
  days: 3,
  bonusDays: 2,
  minBudgetXaf: { image: Number(process.env.DBI_ADS_MIN_IMAGE || 5000), video: Number(process.env.DBI_ADS_MIN_VIDEO || 10000) },
};

// Rough rates vs XAF for budget currencies offered in the form.
const XAF_PER: Record<string, number> = { XAF: 1, XOF: 1, USD: CONVERSION_RATE, CDF: 0.21, GNF: 0.07, NGN: 0.38, GHS: 40, KES: 4.6, EUR: 656 };

export function toXaf(amount: number, currency: string) {
  return Math.round(amount * (XAF_PER[currency.toUpperCase()] ?? 1));
}

export function simulate(input: { budget: number; currency: string; mediaType: "image" | "video" }) {
  const budgetXaf = toXaf(input.budget, input.currency);
  const min = ADS.minBudgetXaf[input.mediaType];
  const minInCurrency = Math.ceil(min / (XAF_PER[input.currency.toUpperCase()] ?? 1));
  const targetViews = Math.floor(budgetXaf / ADS.costPerView);
  return { budgetXaf, costPerView: ADS.costPerView, targetViews, days: ADS.days, bonusDays: ADS.bonusDays, totalDays: ADS.days + ADS.bonusDays, minBudgetXaf: min, minInCurrency, ok: budgetXaf >= min, estimatedReach: Math.round(targetViews * 1.35) };
}

export type CampaignInput = {
  title: string;
  mediaType: "image" | "video";
  mediaUrl?: string;
  description: string;
  publishText: string;
  budget: number;
  currency: string;
  whatsapp?: string;
  phone?: string;
  website?: string;
  targetCountries?: string[];
  targetCities?: string[];
  interests?: string[];
  ageMin?: number;
  ageMax?: number;
};

export const INTERESTS = ["Business", "E-commerce", "Formation", "Crypto", "Immobilier", "Mode & Beauté", "Santé", "Technologie", "Emploi", "Voyage", "Alimentation", "Éducation"];

export async function createCampaign(user: User, input: CampaignInput) {
  const sim = simulate(input);
  if (!sim.ok) throw new WalletError(`Budget minimum ${input.mediaType === "video" ? "vidéo" : "image"} : ${sim.minInCurrency} ${input.currency} (${sim.minBudgetXaf} FCFA).`, 422);
  return db.transaction(async (tx) => {
    const [u] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, user.id)).for("update");
    if (!u || u.balance < sim.budgetXaf) throw new WalletError(`Solde insuffisant : ${sim.budgetXaf} FCFA requis. Rechargez votre compte.`, 422);
    await tx.update(users).set({ balance: sql`${users.balance} - ${sim.budgetXaf}` }).where(eq(users.id, user.id));
    await tx.insert(transactions).values({ userId: user.id, type: "ads", amount: sim.budgetXaf, currency: "XAF", status: "completed", reference: txRef("AD"), label: `Campagne DBI Ads : ${input.title}`, meta: { budget: input.budget, currency: input.currency } });
    const [row] = await tx
      .insert(adCampaigns)
      .values({
        advertiserId: user.id,
        title: input.title,
        mediaType: input.mediaType,
        mediaUrl: input.mediaUrl || null,
        description: input.description,
        publishText: input.publishText,
        budget: input.budget,
        currency: input.currency.toUpperCase(),
        budgetXaf: sim.budgetXaf,
        costPerView: ADS.costPerView,
        targetViews: sim.targetViews,
        days: ADS.days,
        bonusDays: ADS.bonusDays,
        whatsapp: input.whatsapp || null,
        phone: input.phone || null,
        website: input.website || null,
        targetCountries: input.targetCountries ?? [],
        targetCities: input.targetCities ?? [],
        interests: input.interests ?? [],
        ageMin: input.ageMin ?? 18,
        ageMax: input.ageMax ?? 120,
        trackingCode: randomBytes(4).toString("hex"),
        status: "pending",
      })
      .returning();
    return row;
  });
}

export async function advertiserOverview(userId: string) {
  const campaigns = await db.select().from(adCampaigns).where(eq(adCampaigns.advertiserId, userId)).orderBy(desc(adCampaigns.createdAt));
  const count = (s: string) => campaigns.filter((c) => c.status === s).length;
  return {
    campaigns,
    stats: { total: campaigns.length, active: count("active"), pending: count("pending"), completed: count("completed"), spent: campaigns.reduce((a, c) => a + c.budgetXaf, 0), views: campaigns.reduce((a, c) => a + c.views, 0) },
    config: { minImage: ADS.minBudgetXaf.image, minVideo: ADS.minBudgetXaf.video, costPerView: ADS.costPerView, days: ADS.days, bonusDays: ADS.bonusDays, publisherPerView: ADS.publisherPerView },
  };
}

/* ---------------- Publisher (diffuseur) ---------------- */

const VERIFY_AFTER_H = 23;
const VERIFY_WINDOW_MIN = 50;

export const PUBLISHER_RULES = [
  "Publiez le texte complet et le visuel sur votre statut WhatsApp, sans modification.",
  `Attendez au moins ${VERIFY_AFTER_H} h, puis vérifiez entre ${VERIFY_AFTER_H} h 00 et ${VERIFY_AFTER_H} h ${VERIFY_WINDOW_MIN}.`,
  "Ne supprimez pas le statut avant la vérification.",
  "La capture doit montrer clairement le nombre de vues et le visuel de la campagne.",
  "Toute capture falsifiée entraîne le rejet et une baisse de votre score diffuseur.",
  "Les vues validées sont créditées sur vos gains après contrôle de l'équipe DBI.",
];

async function hasValidatedTest(userId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(adPublications)
    .innerJoin(adCampaigns, eq(adPublications.campaignId, adCampaigns.id))
    .where(and(eq(adPublications.publisherId, userId), eq(adCampaigns.isTest, true), eq(adPublications.status, "completed")));
  return (r?.n ?? 0) > 0;
}

export async function publisherOverview(userId: string) {
  const testDone = await hasValidatedTest(userId);
  const pubs = await db
    .select({ p: adPublications, c: adCampaigns })
    .from(adPublications)
    .innerJoin(adCampaigns, eq(adPublications.campaignId, adCampaigns.id))
    .where(eq(adPublications.publisherId, userId))
    .orderBy(desc(adPublications.createdAt));
  const dayRows = pubs.length
    ? await db.select().from(adPublicationDays).where(sql`${adPublicationDays.publicationId} in (${sql.join(pubs.map((x) => sql`${x.p.id}`), sql`, `)})`).orderBy(adPublicationDays.day)
    : [];
  const mine = pubs.map(({ p, c }) => ({
    ...p,
    campaign: { id: c.id, title: c.title, description: c.description, publishText: c.publishText, mediaUrl: c.mediaUrl, mediaType: c.mediaType, trackingCode: c.trackingCode, isTest: c.isTest, days: c.days, targetCountries: c.targetCountries, targetCities: c.targetCities, status: c.status },
    days: dayRows.filter((d) => d.publicationId === p.id),
  }));
  const takenIds = new Set(pubs.map((x) => x.p.campaignId));
  const availableRows = await db
    .select({ c: adCampaigns, advertiser: users.name })
    .from(adCampaigns)
    .innerJoin(users, eq(adCampaigns.advertiserId, users.id))
    .where(and(eq(adCampaigns.status, "active"), sql`${adCampaigns.advertiserId} <> ${userId}`))
    .orderBy(desc(adCampaigns.isTest), desc(adCampaigns.createdAt));
  const available = availableRows
    .filter((r) => testDone || r.c.isTest || takenIds.has(r.c.id) || false)
    .map((r) => ({ ...r.c, advertiser: r.advertiser, taken: takenIds.has(r.c.id), progress: r.c.targetViews ? Math.min(100, Math.round((r.c.views / r.c.targetViews) * 100)) : 0 }));
  const lockedCount = availableRows.filter((r) => !testDone && !r.c.isTest).length;

  const verifiedViews = mine.reduce((a, m) => a + m.verifiedViews, 0);
  const earned = mine.reduce((a, m) => a + m.earned, 0);
  const verifiedDays = dayRows.filter((d) => d.status === "verified");
  const rejectedDays = dayRows.filter((d) => d.status === "rejected").length;
  const avg = verifiedDays.length ? Math.round(verifiedViews / verifiedDays.length) : 0;
  const score = Math.max(0, Math.min(100, 50 + verifiedDays.length * 5 - rejectedDays * 10));
  const estimation = Math.max(500, Math.round(avg * 1.2 / 50) * 50);

  return {
    testDone,
    lockedCount,
    available,
    mine,
    stats: { verifiedViews, earned, avg, score, estimation, campaigns: mine.filter((m) => m.status === "accepted").length },
    perView: ADS.publisherPerView,
    rules: PUBLISHER_RULES,
    verifyAfterHours: VERIFY_AFTER_H,
    verifyWindowMinutes: VERIFY_WINDOW_MIN,
  };
}

export async function publishCampaign(user: User, campaignId: string) {
  const [c] = await db.select().from(adCampaigns).where(and(eq(adCampaigns.id, campaignId), eq(adCampaigns.status, "active"))).limit(1);
  if (!c) throw new WalletError("Campagne indisponible.", 404);
  if (c.advertiserId === user.id) throw new WalletError("Vous ne pouvez pas diffuser votre propre campagne.", 422);
  if (!c.isTest && !(await hasValidatedTest(user.id))) throw new WalletError("Validez d'abord la campagne test pour débloquer les campagnes rémunérées.", 403);
  const [existing] = await db.select().from(adPublications).where(and(eq(adPublications.campaignId, campaignId), eq(adPublications.publisherId, user.id))).limit(1);
  if (existing) return existing;
  const expiresAt = new Date(Date.now() + (c.days + c.bonusDays + 2) * 24 * 3600 * 1000);
  return db.transaction(async (tx) => {
    const [row] = await tx.insert(adPublications).values({ campaignId, publisherId: user.id, status: "accepted", expiresAt }).returning();
    await tx.insert(adPublicationDays).values(Array.from({ length: c.days }, (_, i) => ({ publicationId: row.id, day: i + 1 })));
    return row;
  });
}

async function ownedDay(user: User, dayId: string) {
  const [r] = await db
    .select({ d: adPublicationDays, p: adPublications })
    .from(adPublicationDays)
    .innerJoin(adPublications, eq(adPublicationDays.publicationId, adPublications.id))
    .where(and(eq(adPublicationDays.id, dayId), eq(adPublications.publisherId, user.id)))
    .limit(1);
  if (!r) throw new WalletError("Publication introuvable.", 404);
  return r;
}

/** Mark day N as published on WhatsApp (unlocks verification after 23h). */
export async function publishDay(user: User, dayId: string) {
  const { d, p } = await ownedDay(user, dayId);
  if (d.status !== "pending") return d;
  if (d.day > 1) {
    const [prev] = await db.select().from(adPublicationDays).where(and(eq(adPublicationDays.publicationId, p.id), eq(adPublicationDays.day, d.day - 1))).limit(1);
    if (!prev || !["submitted", "verified"].includes(prev.status)) throw new WalletError(`Terminez d'abord le jour ${d.day - 1}.`, 422);
  }
  const now = new Date();
  const [row] = await db.update(adPublicationDays).set({ status: "published", publishedAt: now, dueAt: new Date(now.getTime() + VERIFY_AFTER_H * 3600 * 1000) }).where(eq(adPublicationDays.id, dayId)).returning();
  return row;
}

/** Submit the screenshot for day N (must be within the verification window unless test campaign). */
export async function submitDayProof(user: User, dayId: string, proofUrl: string, views: number) {
  const { d, p } = await ownedDay(user, dayId);
  if (d.status !== "published") throw new WalletError("Publiez d'abord ce jour sur votre statut.", 422);
  const [c] = await db.select({ isTest: adCampaigns.isTest, days: adCampaigns.days }).from(adCampaigns).where(eq(adCampaigns.id, p.campaignId)).limit(1);
  const elapsedMin = d.publishedAt ? (Date.now() - d.publishedAt.getTime()) / 60000 : 0;
  const minMin = VERIFY_AFTER_H * 60;
  if (!c?.isTest && elapsedMin < minMin) throw new WalletError(`Trop tôt : vérifiez entre ${VERIFY_AFTER_H} h 00 et ${VERIFY_AFTER_H} h ${VERIFY_WINDOW_MIN} après publication.`, 422);
  if (!c?.isTest && elapsedMin > minMin + VERIFY_WINDOW_MIN) throw new WalletError("Fenêtre de vérification dépassée. Ce jour sera examiné manuellement.", 422);
  const v = Math.max(0, Math.floor(views));
  return db.transaction(async (tx) => {
    const [row] = await tx.update(adPublicationDays).set({ status: c?.isTest ? "verified" : "submitted", proofUrl, views: v, verifiedViews: c?.isTest ? v : 0 }).where(eq(adPublicationDays.id, dayId)).returning();
    if (c?.isTest) {
      // Test campaign: auto-validate so the publisher unlocks paid campaigns.
      const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(adPublicationDays).where(and(eq(adPublicationDays.publicationId, p.id), eq(adPublicationDays.status, "verified")));
      await tx.update(adPublications).set({ verifiedViews: sql`${adPublications.verifiedViews} + ${v}`, views: sql`${adPublications.views} + ${v}`, status: n >= (c.days || 1) ? "completed" : "accepted" }).where(eq(adPublications.id, p.id));
    } else {
      await tx.update(adPublications).set({ views: sql`${adPublications.views} + ${v}` }).where(eq(adPublications.id, p.id));
    }
    return row;
  });
}

/** Admin-side helper: validate a submitted day and pay the publisher. */
export async function verifyDay(dayId: string, verifiedViews: number, approve = true) {
  const [d] = await db.select().from(adPublicationDays).where(eq(adPublicationDays.id, dayId)).limit(1);
  if (!d) throw new WalletError("Jour introuvable.", 404);
  const [p] = await db.select().from(adPublications).where(eq(adPublications.id, d.publicationId)).limit(1);
  if (!p) throw new WalletError("Publication introuvable.", 404);
  const pay = approve ? Math.floor(verifiedViews * ADS.publisherPerView) : 0;
  await db.transaction(async (tx) => {
    await tx.update(adPublicationDays).set({ status: approve ? "verified" : "rejected", verifiedViews: approve ? verifiedViews : 0 }).where(eq(adPublicationDays.id, dayId));
    await tx.update(adPublications).set({ verifiedViews: sql`${adPublications.verifiedViews} + ${approve ? verifiedViews : 0}`, earned: sql`${adPublications.earned} + ${pay}` }).where(eq(adPublications.id, p.id));
    if (pay > 0) {
      await tx.update(users).set({ gains: sql`${users.gains} + ${pay}` }).where(eq(users.id, p.publisherId));
      await tx.insert(transactions).values({ userId: p.publisherId, type: "revenue", amount: pay, currency: "XAF", status: "completed", reference: txRef("VW"), label: `Vues validées – jour ${d.day}`, meta: { publicationId: p.id, verifiedViews } });
      await tx.update(adCampaigns).set({ views: sql`${adCampaigns.views} + ${verifiedViews}` }).where(eq(adCampaigns.id, p.campaignId));
    }
  });
}
