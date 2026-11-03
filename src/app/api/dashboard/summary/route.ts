import { NextResponse } from "next/server";
import { getCurrentUser, publicUser } from "@/lib/auth";
import { adsTotal, chartSeries, ensureMatricule, listTransactions, monthlyLeaderboard, mySalesThisMonth } from "@/lib/wallet";

export async function GET() {
  let user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  user = await ensureMatricule(user);
  const [leaders, mySales, chart, ads, recent] = await Promise.all([
    monthlyLeaderboard(3),
    mySalesThisMonth(user),
    chartSeries(user.id, "week"),
    adsTotal(user.id),
    listTransactions(user.id, 10),
  ]);
  return NextResponse.json({
    user: { ...publicUser(user), whatsapp: user.whatsapp, matricule: user.matricule, balance: user.balance, gains: user.gains, balanceUsd: user.balanceUsd, feuilles: user.feuilles, totalWithdrawn: user.totalWithdrawn, avatarUrl: user.avatarUrl },
    leaders,
    mySales,
    chart,
    ads,
    recent,
  });
}
