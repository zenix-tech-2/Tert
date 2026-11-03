import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type Referral = { id: string; name: string; whatsapp: string; countryCode: string; status: string; level: 1 | 2 | 3; createdAt: Date; activatedAt: Date | null; sponsorName: string | null };

export type LevelStats = { total: number; active: number; inactive: number; pct: number };
export type ReferralTree = { levels: Record<1 | 2 | 3, LevelStats>; total: LevelStats; referrals: Referral[] };

const pick = { id: users.id, name: users.name, whatsapp: users.whatsapp, countryCode: users.countryCode, status: users.status, createdAt: users.createdAt, activatedAt: users.activatedAt, referralCode: users.referralCode, referredBy: users.referredBy };

function stats(list: Referral[]): LevelStats {
  const active = list.filter((r) => r.status === "active").length;
  const total = list.length;
  return { total, active, inactive: total - active, pct: total ? Math.round((active / total) * 10000) / 100 : 0 };
}

/** Walk 3 levels deep from the given referral code. */
export async function referralTree(rootCode: string): Promise<ReferralTree> {
  const all: Referral[] = [];
  let codes = [rootCode];
  let names: Record<string, string> = {};
  for (const level of [1, 2, 3] as const) {
    if (!codes.length) break;
    const rows = await db.select(pick).from(users).where(inArray(users.referredBy, codes));
    for (const r of rows) all.push({ id: r.id, name: r.name, whatsapp: r.whatsapp, countryCode: r.countryCode, status: r.status, level, createdAt: r.createdAt, activatedAt: r.activatedAt, sponsorName: level === 1 ? null : names[r.referredBy ?? ""] ?? null });
    names = Object.fromEntries(rows.map((r) => [r.referralCode, r.name]));
    codes = rows.map((r) => r.referralCode);
  }
  const by = (l: 1 | 2 | 3) => stats(all.filter((r) => r.level === l));
  return { levels: { 1: by(1), 2: by(2), 3: by(3) }, total: stats(all), referrals: all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
}

export async function sponsorOf(code: string | null) {
  if (!code) return null;
  const [s] = await db.select({ name: users.name }).from(users).where(eq(users.referralCode, code)).limit(1);
  return s ?? null;
}
