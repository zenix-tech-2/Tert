import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    countryCode: text("country_code").notNull(),
    dialCode: text("dial_code").notNull(),
    whatsapp: text("whatsapp").notNull(),
    referralCode: text("referral_code").notNull().unique(),
    referredBy: text("referred_by"),
    status: text("status").notNull().default("pending"), // pending | active
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    matricule: text("matricule").unique(),
    balance: integer("balance").notNull().default(0), // main balance, FCFA
    gains: integer("gains").notNull().default(0), // earnings (statuts / ads), FCFA, transferable to balance
    balanceUsd: integer("balance_usd").notNull().default(0), // USD cents
    feuilles: integer("feuilles").notNull().default(0),
    totalWithdrawn: integer("total_withdrawn").notNull().default(0),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("member"), // member | admin
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_referral_idx").on(t.referralCode), index("users_referred_by_idx").on(t.referredBy)],
);

export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // deposit | withdrawal | commission | revenue | ads | transfer | activation
    amount: integer("amount").notNull(), // FCFA (or USD cents when currency = USD)
    currency: text("currency").notNull().default("XAF"),
    status: text("status").notNull().default("completed"), // pending | approved | completed | failed | rejected
    reference: text("reference").notNull(),
    label: text("label"),
    operator: text("operator"), // MTN, Orange, DBI, USDT.TRC20 ...
    destination: text("destination"), // phone or wallet address
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("transactions_user_idx").on(t.userId, t.createdAt)],
);

export const withdrawalAccounts = pgTable("withdrawal_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  operator: text("operator").notNull(),
  countryCode: text("country_code").notNull(),
  phone: text("phone").notNull(),
  holderName: text("holder_name"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaction = typeof transactions.$inferSelect;
export type WithdrawalAccount = typeof withdrawalAccounts.$inferSelect;

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reference: text("reference").notNull().unique(), // merchant reference sent to AshTechPay
    purpose: text("purpose").notNull().default("activation"), // activation | deposit
    creditAmount: integer("credit_amount").notNull().default(0), // FCFA credited to wallet on success (deposits)
    method: text("method").notNull(), // mobile_money | crypto
    countryCode: text("country_code").notNull(),
    currency: text("currency").notNull(),
    amount: integer("amount").notNull(), // amount in major units (XOF 2900, USD 6)
    operator: text("operator"),
    phone: text("phone"),
    assetCode: text("asset_code"),
    providerId: text("provider_id"), // AshTechPay transaction_id
    providerReference: text("provider_reference"), // OTP session reference
    status: text("status").notNull().default("created"),
    // created | pending | otp_required | success | failed | expired
    isDemo: boolean("is_demo").notNull().default(false),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_user_idx").on(t.userId), index("payments_provider_idx").on(t.providerId)],
);

export const paymentEvents = pgTable("payment_events", {
  id: text("id").primaryKey(),
  providerId: text("provider_id"),
  event: text("event").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Payment = typeof payments.$inferSelect;

/* ------------------------------------------------------------------ */
/* Catalog: formations, ebooks, boutique products                      */
/* ------------------------------------------------------------------ */

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(), // formation | ebook | product
    sellerId: uuid("seller_id").references(() => users.id, { onDelete: "set null" }), // null = DBI official
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("Général"),
    price: integer("price").notNull().default(0), // FCFA, 0 = free
    promo: boolean("promo").notNull().default(false),
    coverUrl: text("cover_url"),
    durationLabel: text("duration_label"), // formations: "3h30"
    format: text("format"), // formations: video | pdf | live ; ebooks: pdf | drive
    accessUrl: text("access_url"), // link delivered after acquisition
    rating: integer("rating").notNull().default(5),
    ratingCount: integer("rating_count").notNull().default(0),
    status: text("status").notNull().default("published"), // draft | published | archived
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("catalog_kind_idx").on(t.kind, t.status), index("catalog_seller_idx").on(t.sellerId)],
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemId: uuid("item_id")
      .notNull()
      .references(() => catalogItems.id, { onDelete: "cascade" }),
    pricePaid: integer("price_paid").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("purchases_user_idx").on(t.userId), index("purchases_item_idx").on(t.itemId)],
);

export const vendorSubscriptions = pgTable("vendor_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Contacts                                                            */
/* ------------------------------------------------------------------ */

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }), // member whose contact it is
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    countryCode: text("country_code").notNull(),
    countryName: text("country_name").notNull(),
    city: text("city"),
    age: integer("age"),
    profession: text("profession"),
    gender: text("gender"), // M | F
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contacts_country_idx").on(t.countryCode), index("contacts_owner_idx").on(t.ownerId)],
);

export const contactDownloads = pgTable(
  "contact_downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_downloads_user_idx").on(t.userId), index("contact_downloads_contact_idx").on(t.contactId)],
);

export type CatalogItem = typeof catalogItems.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

/* ------------------------------------------------------------------ */
/* DBI Ads Network                                                     */
/* ------------------------------------------------------------------ */

export const adCampaigns = pgTable(
  "ad_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    advertiserId: uuid("advertiser_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    mediaType: text("media_type").notNull().default("image"), // image | video
    mediaUrl: text("media_url"),
    description: text("description").notNull(),
    publishText: text("publish_text").notNull(),
    budget: integer("budget").notNull(), // in budget currency major units
    currency: text("currency").notNull().default("XAF"),
    budgetXaf: integer("budget_xaf").notNull(), // normalized, charged from main balance
    costPerView: integer("cost_per_view").notNull().default(3), // FCFA
    targetViews: integer("target_views").notNull(),
    days: integer("days").notNull().default(3),
    bonusDays: integer("bonus_days").notNull().default(2),
    whatsapp: text("whatsapp"),
    phone: text("phone"),
    website: text("website"),
    targetCountries: jsonb("target_countries").$type<string[]>().notNull().default([]),
    targetCities: jsonb("target_cities").$type<string[]>().notNull().default([]),
    interests: jsonb("interests").$type<string[]>().notNull().default([]),
    ageMin: integer("age_min").notNull().default(18),
    ageMax: integer("age_max").notNull().default(120),
    isTest: boolean("is_test").notNull().default(false),
    status: text("status").notNull().default("pending"), // pending | active | completed | rejected
    views: integer("views").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    trackingCode: text("tracking_code").notNull().unique(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ad_campaigns_adv_idx").on(t.advertiserId), index("ad_campaigns_status_idx").on(t.status)],
);

export const adPublications = pgTable(
  "ad_publications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    verifiedViews: integer("verified_views").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
    earned: integer("earned").notNull().default(0),
    proofUrl: text("proof_url"),
    status: text("status").notNull().default("accepted"), // accepted | completed | rejected
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ad_pub_campaign_idx").on(t.campaignId), index("ad_pub_publisher_idx").on(t.publisherId)],
);

/** One row per day of a publication (Jour 1, Jour 2 …). */
export const adPublicationDays = pgTable(
  "ad_publication_days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicationId: uuid("publication_id")
      .notNull()
      .references(() => adPublications.id, { onDelete: "cascade" }),
    day: integer("day").notNull(),
    status: text("status").notNull().default("pending"), // pending | published | submitted | verified | rejected
    publishedAt: timestamp("published_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    views: integer("views").notNull().default(0),
    verifiedViews: integer("verified_views").notNull().default(0),
    proofUrl: text("proof_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ad_pub_days_pub_idx").on(t.publicationId, t.day)],
);

/* ------------------------------------------------------------------ */
/* Support messenger                                                   */
/* ------------------------------------------------------------------ */

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sender: text("sender").notNull(), // user | support
    body: text("body").notNull().default(""),
    attachmentUrl: text("attachment_url"),
    attachmentType: text("attachment_type"), // image | audio
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("support_user_idx").on(t.userId, t.createdAt)],
);

export type AdCampaign = typeof adCampaigns.$inferSelect;

/* ------------------------------------------------------------------ */
/* SMM (Peakerr)                                                       */
/* ------------------------------------------------------------------ */

export const smmOrders = pgTable(
  "smm_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("peakerr"), // peakerr | smmafrica
    serviceId: integer("service_id").notNull(), // provider service id
    serviceName: text("service_name").notNull(),
    category: text("category").notNull(),
    link: text("link").notNull(),
    quantity: integer("quantity").notNull(),
    priceXaf: integer("price_xaf").notNull(), // charged to the member
    costUsd: integer("cost_usd").notNull(), // provider cost in USD cents (informational)
    providerOrderId: text("provider_order_id"),
    status: text("status").notNull().default("pending"), // pending | in_progress | completed | partial | processing | canceled | failed
    startCount: integer("start_count"),
    remains: integer("remains"),
    extra: jsonb("extra").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("smm_orders_user_idx").on(t.userId, t.createdAt)],
);

export type SmmOrder = typeof smmOrders.$inferSelect;
