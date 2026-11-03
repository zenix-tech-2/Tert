import { adminRoute, q } from "@/lib/api";
import { listTransactionsAdmin } from "@/lib/admin";
export const GET = adminRoute((req) => listTransactionsAdmin(q(req).get("type") || "all", Number(q(req).get("page") || 1)));
