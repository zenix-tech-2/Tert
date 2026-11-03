import { redirect } from "next/navigation";
import PaymentStep from "@/components/PaymentStep";

export default async function PaymentPage({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  const { method } = await searchParams;
  if (method !== "mobile_money" && method !== "crypto") redirect("/activation/method");
  return <PaymentStep method={method} />;
}
