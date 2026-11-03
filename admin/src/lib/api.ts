import { NextResponse } from "next/server";
import { AdminError } from "./admin";
import { requireAdmin } from "./auth";

/** Wrap a handler with admin auth + unified error handling. */
export function adminRoute(fn: (req: Request, admin: Awaited<ReturnType<typeof requireAdmin>>) => Promise<unknown>) {
  return async (req: Request) => {
    try {
      const admin = await requireAdmin();
      const data = await fn(req, admin);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof Response) return e;
      if (e instanceof AdminError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
    }
  };
}
export const q = (req: Request) => new URL(req.url).searchParams;
