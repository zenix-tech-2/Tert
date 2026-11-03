import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { paymentEvents } from "@/db/schema";
import { obj, unwrap, verifyWebhookSignature } from "@/lib/ashtechpay";
import { applyWebhook } from "@/lib/payments";

export const maxDuration = 30;

/**
 * AshTechPay signed webhook (Direct API).
 * Headers: x-ashtech-signature (sha256=...), x-ashtech-timestamp, x-ashtech-event-id
 */
export async function POST(req: Request) {
  const secret = process.env.ASHTECHPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });

  const raw = await req.text();
  if (Buffer.byteLength(raw) > 65536) return NextResponse.json({ error: "Payload trop volumineux." }, { status: 413 });

  const signature = req.headers.get("x-ashtech-signature") || req.headers.get("x-ashtechpay-signature") || "";
  const timestamp = req.headers.get("x-ashtech-timestamp") || req.headers.get("x-ashtechpay-timestamp") || "";
  if (!verifyWebhookSignature(raw, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const root = obj(parsed);
  const data = obj(unwrap(parsed));
  const providerId = String(data.transaction_id ?? root.transaction_id ?? data.id ?? "");
  const reference = String(data.reference ?? data.merchant_reference ?? root.reference ?? "") || null;
  const status = String(data.status ?? root.status ?? "");
  const event = String(root.event ?? data.event ?? status ?? "payment.update");
  const eventId = req.headers.get("x-ashtech-event-id") || createHash("sha256").update(raw).digest("hex");

  if (event.startsWith("conversion.") || event.startsWith("payout.")) {
    return NextResponse.json({ received: true, ignored: true });
  }
  if (!providerId && !reference) return NextResponse.json({ error: "Transaction manquante." }, { status: 400 });

  const inserted = await db
    .insert(paymentEvents)
    .values({ id: eventId, providerId: providerId || null, event, payload: { reference, status, amount: data.amount, currency: data.currency } })
    .onConflictDoNothing()
    .returning({ id: paymentEvents.id });
  if (!inserted.length) return NextResponse.json({ received: true, duplicate: true });

  await applyWebhook(providerId, reference, status);
  return NextResponse.json({ received: true });
}
