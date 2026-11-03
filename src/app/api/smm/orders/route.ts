import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { listOrders, placeOrder, SMM, SmmError, syncOrders } from "@/lib/smm";

const schema = z.object({
  provider: z.enum(["peakerr", "smmafrica"]).default("peakerr"),
  serviceId: z.number().int().positive(),
  link: z.string().trim().min(3).max(500),
  quantity: z.number().int().positive(),
  comments: z.string().max(5000).optional(),
  username: z.string().max(100).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  await syncOrders(user.id);
  return NextResponse.json({ enabled: SMM.enabled(), items: await listOrders(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (!SMM.enabled()) return NextResponse.json({ error: "Service SMM bientôt disponible." }, { status: 503 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    const order = await placeOrder(user, parsed.data);
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    if (e instanceof SmmError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Commande impossible." }, { status: 500 });
  }
}
