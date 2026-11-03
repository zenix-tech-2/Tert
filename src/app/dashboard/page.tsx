import { redirect } from "next/navigation";
import { Leaderboard, PresentationCard, ServicesGrid, TransactionsChart, WalletCard, WithdrawalsCard } from "@/components/app/HomeWidgets";
import { getCurrentUser } from "@/lib/auth";
import { adsTotal, chartSeries, monthlyLeaderboard, mySalesThisMonth } from "@/lib/wallet";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [leaders, mySales, chart, ads] = await Promise.all([monthlyLeaderboard(3), mySalesThisMonth(user), chartSeries(user.id, "week"), adsTotal(user.id)]);

  return (
    <>
      <WalletCard />
      <WithdrawalsCard />
      <ServicesGrid />
      <Leaderboard leaders={leaders} mySales={mySales} />
      <TransactionsChart initial={chart} ads={ads} />
      <PresentationCard />
    </>
  );
}
