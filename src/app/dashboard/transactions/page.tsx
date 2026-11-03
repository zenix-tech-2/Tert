import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Gift, Megaphone, Package, Repeat, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listTransactions } from "@/lib/wallet";

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const META: Record<string, { label: string; icon: React.ReactNode; cls: string; sign: string }> = {
  deposit: { label: "Dépôt", icon: <ArrowDownLeft />, cls: "bg-emerald-50 text-emerald-600", sign: "+" },
  withdrawal: { label: "Retrait", icon: <ArrowUpRight />, cls: "bg-red-50 text-red-600", sign: "-" },
  commission: { label: "Commission", icon: <Gift />, cls: "bg-blue-50 text-blue-600", sign: "+" },
  revenue: { label: "Revenu", icon: <TrendingUp />, cls: "bg-purple-50 text-purple-600", sign: "+" },
  ads: { label: "DBI Ads", icon: <Megaphone />, cls: "bg-amber-50 text-amber-600", sign: "+" },
  transfer: { label: "Transfert", icon: <Repeat />, cls: "bg-sky-50 text-sky-600", sign: "" },
  activation: { label: "Activation", icon: <BadgeCheck />, cls: "bg-emerald-50 text-emerald-600", sign: "" },
  transfer_out: { label: "Transfert envoyé", icon: <ArrowUpRight />, cls: "bg-sky-50 text-sky-600", sign: "-" },
  transfer_in: { label: "Transfert reçu", icon: <ArrowDownLeft />, cls: "bg-sky-50 text-sky-600", sign: "+" },
  conversion: { label: "Conversion", icon: <Repeat />, cls: "bg-indigo-50 text-indigo-600", sign: "" },
  purchase: { label: "Achat", icon: <Package />, cls: "bg-rose-50 text-rose-600", sign: "-" },
};
const STATUS: Record<string, string> = { pending: "En attente", approved: "Approuvé", completed: "Terminé", failed: "Échoué", rejected: "Rejeté" };

export default async function TransactionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const items = await listTransactions(user.id, 100);
  return (
    <>
      <h1 className="text-[34px] font-bold text-ink">Transactions</h1>
      <p className="mt-1 text-[20px] text-gray-500">Historique complet de vos mouvements.</p>
      <section className="card mt-6 divide-y divide-gray-100">
        {items.length === 0 && <p className="px-6 py-12 text-center text-[18px] text-gray-500">Aucune transaction pour le moment.</p>}
        {items.map((t) => {
          const m = META[t.type] ?? META.transfer;
          const amount = t.currency === "USD" ? `${(t.amount / 100).toFixed(2)} $` : `${fmt(t.amount)} F`;
          return (
            <div key={t.id} className="flex items-center gap-4 px-6 py-5">
              <span className={"flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-7 [&>svg]:w-7 " + m.cls}>{m.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[19px] font-semibold text-ink">{t.label || m.label}</p>
                <p className="text-[15px] text-gray-500">
                  {new Date(t.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })} · {t.reference}
                </p>
              </div>
              <div className="text-right">
                <p className={"text-[20px] font-bold " + (m.sign === "-" ? "text-red-600" : m.sign === "+" ? "text-emerald-600" : "text-ink")}>
                  {m.sign}
                  {amount}
                </p>
                <p className="text-[14px] text-gray-500">{STATUS[t.status] ?? t.status}</p>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
