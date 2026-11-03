import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { currentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/login");
  return <Shell admin={{ name: admin.name, email: admin.email }}>{children}</Shell>;
}
