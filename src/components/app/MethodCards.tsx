"use client";

import { Check } from "lucide-react";
import { CryptoCluster, MobileMoneyCluster, UsdcIcon, UsdtIcon, AirtelBadge, MtnBadge, OrangeBadge } from "@/components/BrandIcons";

export type Method = "mobile_money" | "crypto";

/** Large cards used on the Dépôt screen. */
export function MethodCardsLarge({ selected, onSelect }: { selected: Method | null; onSelect: (m: Method) => void }) {
  return (
    <>
      <button type="button" onClick={() => onSelect("mobile_money")} className="card mt-6 block w-full p-12 text-left">
        <div className={"relative rounded-3xl border-[3px] bg-gradient-to-b from-white to-gray-50 px-4 pb-8 pt-6 transition " + (selected === "mobile_money" ? "border-primary shadow-[0_0_0_6px_rgba(59,71,243,0.08)]" : "border-gray-200")}>
          <RadioMark active={selected === "mobile_money"} />
          <MobileMoneyCluster />
          <p className="mt-6 text-center text-[33px] font-bold text-ink">Mobile Money</p>
          <p className="mt-1 text-center text-[22px] text-gray-500">MTN • Orange • Airtel</p>
        </div>
      </button>
      <button type="button" onClick={() => onSelect("crypto")} className="card mt-7 block w-full p-12 text-left">
        <div className={"stripes relative rounded-3xl border-[3px] px-4 pb-8 pt-8 transition " + (selected === "crypto" ? "border-primary shadow-[0_0_0_6px_rgba(59,71,243,0.08)]" : "border-gray-200")}>
          <RadioMark active={selected === "crypto"} />
          <CryptoCluster />
          <p className="mt-6 text-center text-[33px] font-bold text-ink">Cryptomonnaie</p>
          <p className="mt-1 text-center text-[22px] text-gray-500">USDC • USDT</p>
        </div>
      </button>
    </>
  );
}

/** Compact side-by-side cards used on the Retrait screen. */
export function MethodCardsSmall({ selected, onSelect }: { selected: Method; onSelect: (m: Method) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button type="button" onClick={() => onSelect("mobile_money")} className="card p-5 text-left">
        <div className={"relative rounded-2xl border-2 bg-gradient-to-b from-white to-gray-50 px-2 pb-3 pt-3 " + (selected === "mobile_money" ? "border-primary" : "border-gray-200")}>
          <RadioMark active={selected === "mobile_money"} small />
          <div className="relative mx-auto h-14 w-28">
            <span className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#ffcc00] bg-[#0f3d5e]"><MtnBadge className="h-9 w-9" /></span>
            <span className="absolute left-8 top-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#ff7900] bg-black"><OrangeBadge className="h-8 w-8" /></span>
            <span className="absolute left-16 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#e40000]"><AirtelBadge className="h-8 w-8" /></span>
          </div>
          <p className="mt-2 text-center text-[17px] font-bold text-ink">Mobile Money</p>
          <p className="text-center text-[12px] text-gray-500">MTN • Orange • Airtel</p>
        </div>
      </button>
      <button type="button" onClick={() => onSelect("crypto")} className="card p-5 text-left">
        <div className={"stripes relative rounded-2xl border-2 px-2 pb-3 pt-3 " + (selected === "crypto" ? "border-primary" : "border-gray-200")}>
          <RadioMark active={selected === "crypto"} small />
          <div className="relative mx-auto h-14 w-24">
            <UsdcIcon className="absolute left-2 top-1 h-12 w-12" />
            <UsdtIcon className="absolute left-10 top-1 h-12 w-12" />
          </div>
          <p className="mt-2 text-center text-[17px] font-bold text-ink">Cryptomonnaie</p>
          <p className="text-center text-[12px] text-gray-500">USDC • USDT</p>
        </div>
      </button>
    </div>
  );
}

function RadioMark({ active, small }: { active: boolean; small?: boolean }) {
  const size = small ? "h-6 w-6 right-2 top-2 border-2" : "h-12 w-12 right-5 top-5 border-[3px]";
  return (
    <span className={`absolute flex items-center justify-center rounded-full transition ${size} ` + (active ? "border-primary bg-primary text-white" : "border-gray-300 bg-white")}>
      {active && <Check className={small ? "h-4 w-4" : "h-7 w-7"} strokeWidth={3} />}
    </span>
  );
}
