import { adminRoute } from "@/lib/api";
import { overview } from "@/lib/admin";
export const GET = adminRoute(() => overview());
