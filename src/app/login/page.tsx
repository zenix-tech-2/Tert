import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.status === "active" ? "/dashboard" : "/activation");
  return (
    <main className="min-h-dvh">
      <LoginForm />
    </main>
  );
}
