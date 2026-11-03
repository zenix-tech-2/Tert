import { redirect } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.status === "active" ? "/dashboard" : "/activation");
  const { ref } = await searchParams;
  return (
    <main className="min-h-dvh">
      <RegisterForm initialReferral={ref ?? ""} />
    </main>
  );
}
