import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, generateReferralCode, hashPassword, publicUser } from "@/lib/auth";
import { findSignupCountry } from "@/lib/countries";
import { makeMatricule } from "@/lib/wallet";

const schema = z
  .object({
    name: z.string().trim().min(2, "Le nom est requis.").max(100),
    email: z.string().trim().toLowerCase().email("Email invalide."),
    countryCode: z.string().length(2),
    whatsapp: z.string().trim().min(6, "Numéro WhatsApp invalide.").max(20),
    referralCode: z.string().trim().max(30).optional().or(z.literal("")),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères.").max(128),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { message: "Vous devez accepter les conditions générales." }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue.message, field: issue.path[0] }, { status: 422 });
    }
    const data = parsed.data;
    const country = findSignupCountry(data.countryCode);
    if (!country) return NextResponse.json({ error: "Pays invalide.", field: "countryCode" }, { status: 422 });

    const whatsapp = data.whatsapp.replace(/[^\d]/g, "");
    if (whatsapp.length < 6) {
      return NextResponse.json({ error: "Numéro WhatsApp invalide.", field: "whatsapp" }, { status: 422 });
    }

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email.", field: "email" }, { status: 409 });
    }

    let referredBy: string | null = null;
    if (data.referralCode) {
      const code = data.referralCode.toUpperCase();
      const [sponsor] = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
      if (!sponsor) {
        return NextResponse.json({ error: "Code de parrainage introuvable.", field: "referralCode" }, { status: 422 });
      }
      referredBy = code;
    }

    const passwordHash = await hashPassword(data.password);

    // Retry referral code generation on the (very unlikely) collision.
    let created: typeof users.$inferSelect | undefined;
    for (let i = 0; i < 3 && !created; i++) {
      try {
        [created] = await db
          .insert(users)
          .values({
            name: data.name,
            email: data.email,
            passwordHash,
            countryCode: country.code,
            dialCode: country.dial,
            whatsapp: `${country.dial}${whatsapp}`,
            referralCode: generateReferralCode(data.name),
            matricule: makeMatricule(),
            referredBy,
            status: "pending",
          })
          .returning();
      } catch (e) {
        if (i === 2) throw e;
      }
    }
    if (!created) throw new Error("Insert failed");

    await createSession(created.id);
    return NextResponse.json({ user: publicUser(created), next: "/activation" }, { status: 201 });
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ error: "Une erreur est survenue. Réessayez." }, { status: 500 });
  }
}
