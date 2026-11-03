"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LogOut } from "lucide-react";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="flex items-center gap-2 text-[19px] font-medium text-gray-500 transition hover:text-ink disabled:opacity-50"
    >
      <LogOut className="h-6 w-6" />
      Déconnexion
    </button>
  );
}

export function ActivationHeader({ step, backHref }: { step: 1 | 2; backHref?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref} aria-label="Retour" className="-ml-1 p-1 text-ink">
              <ArrowLeft className="h-7 w-7" />
            </Link>
          )}
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-ink">Activation du compte</h1>
            <p className="text-[17px] text-gray-500">Étape {step} sur 2</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

export function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <div className="mx-auto flex max-w-md items-center px-6 py-5">
      <div className="flex items-center gap-3">
        <span
          className={
            "flex h-12 w-12 items-center justify-center rounded-full text-[19px] font-bold text-white " +
            (step === 1 ? "bg-primary" : "bg-brand-green")
          }
        >
          {step === 1 ? "1" : <Check className="h-6 w-6" strokeWidth={3} />}
        </span>
        <span className="text-[21px] font-semibold text-ink">Pack</span>
      </div>
      <div className="mx-4 h-[2px] flex-1 bg-gray-300" />
      <div className="flex items-center gap-3">
        <span
          className={
            "flex h-12 w-12 items-center justify-center rounded-full text-[19px] font-bold " +
            (step === 2 ? "bg-primary text-white" : "bg-gray-200 text-gray-500")
          }
        >
          2
        </span>
        <span className={"text-[21px] font-semibold " + (step === 2 ? "text-ink" : "text-gray-400")}>Paiement</span>
      </div>
    </div>
  );
}
