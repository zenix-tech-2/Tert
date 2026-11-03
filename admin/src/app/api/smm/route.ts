import { adminRoute, q } from "@/lib/api";
import { listSmmOrders, smmProviderBalances } from "@/lib/admin";
export const GET = adminRoute(async (req) => ({ ...(await listSmmOrders(q(req).get("status") || "all", Number(q(req).get("page") || 1))), providers: await smmProviderBalances() }));
