"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Check, Inbox } from "lucide-react";
import { CryptoCluster, MobileMoneyCluster } from "@/components/BrandIcons";

type Method = "mobile_money" | "crypto";

export default function PaymentMethodPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Method>("mobile_money");

  function choose(m: Method) {
    setSelected(m);
    // Short delay so the selection state is visible before navigating.
    setTimeout(() => router.push(`/activation/payment?method=${m}`), 180);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-6 pb-16 pt-8">
      <Link href="/activation" className="flex items-center gap-4 text-[21px] font-medium text-gray-600">
        <ArrowLeft className="h-7 w-7" />
        Retour
      </Link>

      <h1 className="mt-9 flex items-center gap-4 text-[26px] font-bold text-ink">
        <Inbox className="h-9 w-9" strokeWidth={2} />
        Méthode de paiement
      </h1>

      {/* Mobile Money */}
      <button type="button" onClick={() => choose("mobile_money")} className="card mt-8 block w-full p-12 text-left">
        <div
          className={
            "relative rounded-3xl border-[3px] bg-gradient-to-b from-white to-gray-50 px-4 pb-8 pt-6 transition " +
            (selected === "mobile_money" ? "border-primary shadow-[0_0_0_6px_rgba(59,71,243,0.08)]" : "border-gray-200")
          }
        >
          <RadioMark active={selected === "mobile_money"} />
          <MobileMoneyCluster />
          <p className="mt-6 text-center text-[33px] font-bold text-ink">Mobile Money</p>
          <p className="mt-1 text-center text-[22px] text-gray-500">MTN • Orange • Airtel</p>
        </div>
      </button>

      {/* Crypto */}
      <button type="button" onClick={() => choose("crypto")} className="card mt-7 block w-full p-12 text-left">
        <div
          className={
            "stripes relative rounded-3xl border-[3px] px-4 pb-8 pt-8 transition " +
            (selected === "crypto" ? "border-primary shadow-[0_0_0_6px_rgba(59,71,243,0.08)]" : "border-gray-200")
          }
        >
          <RadioMark active={selected === "crypto"} />
          <CryptoCluster />
          <p className="mt-6 text-center text-[33px] font-bold text-ink">Cryptomonnaie</p>
          <p className="mt-1 text-center text-[22px] text-gray-500">USDC • USDT</p>
        </div>
      </button>

      <p className="mt-7 text-center text-[24px] font-bold text-ink">Activation : 6.00 USD</p>
    </main>
  );
}

function RadioMark({ active }: { active: boolean }) {
  return (
    <span
      className={
        "absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border-[3px] transition " +
        (active ? "border-primary bg-primary text-white" : "border-gray-300 bg-white")
      }
    >
      {active && <Check className="h-7 w-7" strokeWidth={3} />}
    </span>
  );
}
