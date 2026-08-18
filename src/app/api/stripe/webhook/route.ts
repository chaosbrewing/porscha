import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { verifyStripeSignature } from "@/server/sales/verify";
import { markSold, releaseIfSession } from "@/server/sales/service";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — the only writer of `sold_at`.
 *
 * The signature is verified against the raw body before anything is
 * parsed, exactly like the GitHub webhook. A browser arriving at the
 * success URL is never treated as proof of payment.
 */
export async function POST(req: NextRequest) {
  if (!env.salesConfigured) {
    return NextResponse.json({ error: "Sales are not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET!, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    id?: string;
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const object = event.data?.object ?? {};
  const slug = (object.metadata as Record<string, string> | undefined)
    ?.gallery_slug;
  const sessionId = typeof object.id === "string" ? object.id : null;

  // Events for anything that isn't one of our pieces are accepted and
  // dropped, so an account-wide endpoint stays safe.
  if (!slug) return NextResponse.json({ ok: true, ignored: true });

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        if (object.payment_status !== "paid") {
          // Completed but unpaid (e.g. a delayed method); the hold
          // stands until it either succeeds or expires.
          return NextResponse.json({ ok: true, pending: true });
        }
        const paymentIntent =
          typeof object.payment_intent === "string" ? object.payment_intent : null;
        const sold = await markSold(slug, paymentIntent);
        return NextResponse.json({ ok: true, sold });
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        if (sessionId) await releaseIfSession(slug, sessionId);
        return NextResponse.json({ ok: true, released: true });
      }

      default:
        return NextResponse.json({ ok: true, ignored: true });
    }
  } catch (err) {
    console.error("[stripe] webhook handling failed:", err);
    // 500 so Stripe retries; every handler above is idempotent.
    return NextResponse.json({ error: "Handling failed" }, { status: 500 });
  }
}
