import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ActivationHeader, Stepper } from "@/components/ActivationHeader";
import PackCard from "@/components/PackCard";

export default function ActivationStep1() {
  return (
    <>
      <ActivationHeader step={1} />
      <Stepper step={1} />

      <main className="mx-auto max-w-md px-6 pb-40">
        <PackCard />
      </main>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-md px-6 py-5">
          <Link href="/activation/method" className="btn-primary">
            Commencer à gagner avec mes statuts
            <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </>
  );
}
