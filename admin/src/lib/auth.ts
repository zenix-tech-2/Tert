import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminSessions, users, type User } from "@/db/schema";

export const COOKIE = "dbi_admin_session";

export async function login(email: string, password: string) {
  const [u] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  if (!u || u.role !== "admin" || !(await bcrypt.compare(password, u.passwordHash))) return null;
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 12 * 3600 * 1000);
  await db.insert(adminSessions).values({ id: token, userId: u.id, expiresAt });
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  return u;
}

export async function logout() {
  const store = await cookies();
  const t = store.get(COOKIE)?.value;
  if (t) await db.delete(adminSessions).where(eq(adminSessions.id, t));
  store.delete(COOKIE);
}

export async function currentAdmin(): Promise<User | null> {
  const store = await cookies();
  const t = store.get(COOKIE)?.value;
  if (!t) return null;
  const rows = await db.select({ u: users }).from(adminSessions).innerJoin(users, eq(adminSessions.userId, users.id)).where(and(eq(adminSessions.id, t), gt(adminSessions.expiresAt, new Date()))).limit(1);
  const u = rows[0]?.u;
  return u && u.role === "admin" ? u : null;
}

export async function requireAdmin() {
  const a = await currentAdmin();
  if (!a) throw new Response(JSON.stringify({ error: "Non autorisé." }), { status: 401, headers: { "Content-Type": "application/json" } });
  return a;
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
