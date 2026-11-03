"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { MethodCardsLarge, type Method } from "@/components/app/MethodCards";
import PaymentStep from "@/components/PaymentStep";

export default function DepotPage() {
  const [method, setMethod] = useState<Method | null>(null);
  const [step, setStep] = useState<"choose" | "pay">("choose");

  if (step === "pay" && method) {
    return <PaymentStep key={method} method={method} mode="deposit" onBack={() => setStep("choose")} />;
  }

  return (
    <>
      <h1 className="flex items-center gap-4 text-[26px] font-bold text-ink">
        <Inbox className="h-9 w-9" strokeWidth={2} />
        Méthode de paiement
      </h1>
      <MethodCardsLarge
        selected={method}
        onSelect={(m) => {
          setMethod(m);
          setTimeout(() => setStep("pay"), 180);
        }}
      />
    </>
  );
}
