import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell, { type AppUser } from "@/components/app/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { ensureMatricule } from "@/lib/wallet";
import { SMM } from "@/lib/smm";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/activation");
  user = await ensureMatricule(user);

  const appUser: AppUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    countryCode: user.countryCode,
    referralCode: user.referralCode,
    matricule: user.matricule,
    balance: user.balance,
    gains: user.gains,
    balanceUsd: user.balanceUsd,
    feuilles: user.feuilles,
    totalWithdrawn: user.totalWithdrawn,
    avatarUrl: user.avatarUrl,
    status: user.status,
  };

  return (
    <AppShell user={appUser} features={{ smmEnabled: SMM.enabled() }}>
      {children}
    </AppShell>
  );
}
