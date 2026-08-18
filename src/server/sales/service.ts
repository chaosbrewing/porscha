import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { env } from "@/server/env";
import { getGalleryAdminView, type ResolvedPiece } from "@/server/gallery/service";
import { readItem } from "@/server/gallery/store";
import { createCheckoutSession } from "./stripe";

/**
 * Selling one-off originals.
 *
 * Each piece is unique, so the entire risk is two people paying for the
 * same painting. Two rules contain it:
 *
 *  1. A checkout may only start by winning an atomic conditional
 *     UPDATE. The database decides who gets the piece, not the app —
 *     concurrent requests cannot both see it as available.
 *  2. `soldAt` is written only by the Stripe webhook, after Stripe says
 *     the payment succeeded. The browser returning to the success URL
 *     proves nothing: it is attacker-controlled and fires before the
 *     payment may have settled.
 *
 * A reservation expires on its own, so an abandoned checkout releases
 * the piece without anyone intervening.
 */

/** Matches the checkout session's own expiry in `createCheckoutSession`. */
const HOLD_MINUTES = 30;

export type SaleState =
  | { status: "not_for_sale" }
  | { status: "available"; priceCents: number; currency: string }
  | { status: "held"; priceCents: number; currency: string }
  | { status: "sold"; priceCents: number | null; currency: string };

export function saleStateOf(row: {
  forSale: boolean;
  priceCents: number | null;
  currency: string | null;
  soldAt: Date | null;
  reservedUntil: Date | null;
}): SaleState {
  const currency = row.currency ?? env.SALES_CURRENCY;
  if (row.soldAt) {
    return { status: "sold", priceCents: row.priceCents, currency };
  }
  if (!row.forSale || row.priceCents === null || row.priceCents <= 0) {
    return { status: "not_for_sale" };
  }
  if (row.reservedUntil && row.reservedUntil > new Date()) {
    return { status: "held", priceCents: row.priceCents, currency };
  }
  return { status: "available", priceCents: row.priceCents, currency };
}

/** Sale state for a public piece, or not_for_sale when nothing is set. */
export async function saleStateFor(slug: string): Promise<SaleState> {
  const row = await readItem(slug);
  if (!row) return { status: "not_for_sale" };
  return saleStateOf(row);
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string; status: number };

/**
 * Claim the piece, then open a checkout for it.
 *
 * The claim is a single conditional UPDATE: it succeeds only if the
 * piece is for sale, unsold, and either unreserved or holding a lapsed
 * reservation. Losing that race is a 409, not a second checkout.
 */
export async function startCheckout(
  piece: ResolvedPiece,
  origin: string,
): Promise<CheckoutResult> {
  if (!env.salesConfigured) {
    return { ok: false, status: 503, error: "Purchasing isn't available right now." };
  }

  const now = new Date();
  const until = new Date(now.getTime() + HOLD_MINUTES * 60_000);

  const claimed = await db
    .update(schema.galleryItems)
    .set({ reservedUntil: until, updatedAt: now })
    .where(
      and(
        eq(schema.galleryItems.slug, piece.slug),
        eq(schema.galleryItems.forSale, true),
        isNull(schema.galleryItems.soldAt),
        sql`${schema.galleryItems.priceCents} > 0`,
        or(
          isNull(schema.galleryItems.reservedUntil),
          lt(schema.galleryItems.reservedUntil, now),
        ),
      ),
    )
    .returning({
      slug: schema.galleryItems.slug,
      priceCents: schema.galleryItems.priceCents,
      currency: schema.galleryItems.currency,
      title: schema.galleryItems.title,
    });

  if (claimed.length === 0) {
    // Either sold, not for sale, or someone else is mid-checkout. Say
    // which, so the buyer knows whether waiting would help.
    const state = await saleStateFor(piece.slug);
    if (state.status === "sold") {
      return { ok: false, status: 409, error: "This piece has sold." };
    }
    if (state.status === "held") {
      return {
        ok: false,
        status: 409,
        error:
          "Someone is checking out with this piece right now. " +
          "Try again in half an hour if it doesn't sell.",
      };
    }
    return { ok: false, status: 404, error: "This piece isn't for sale." };
  }

  const row = claimed[0];
  try {
    const session = await createCheckoutSession({
      slug: piece.slug,
      title: piece.title,
      priceCents: row.priceCents!,
      currency: row.currency ?? env.SALES_CURRENCY,
      imageUrl: piece.media.startsWith("/") ? `${origin}${piece.media}` : undefined,
      successUrl: `${origin}/gallery/${piece.slug}?purchase=complete`,
      cancelUrl: `${origin}/gallery/${piece.slug}?purchase=cancelled`,
      // Scoped to this reservation, so a retry inside one hold reuses
      // the same session instead of opening a second one.
      idempotencyKey: `${piece.slug}:${until.getTime()}`,
    });

    if (!session.url) throw new Error("Stripe returned no checkout URL");

    await db
      .update(schema.galleryItems)
      .set({ stripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(schema.galleryItems.slug, piece.slug));

    return { ok: true, url: session.url };
  } catch (err) {
    // The claim must not outlive a checkout that never opened.
    await releaseReservation(piece.slug).catch(() => {});
    console.error("[sales] checkout creation failed:", err);
    return {
      ok: false,
      status: 502,
      error: "Couldn't open checkout. Nothing was charged — try again shortly.",
    };
  }
}

export async function releaseReservation(slug: string): Promise<void> {
  await db
    .update(schema.galleryItems)
    .set({ reservedUntil: null, stripeSessionId: null, updatedAt: new Date() })
    .where(
      and(eq(schema.galleryItems.slug, slug), isNull(schema.galleryItems.soldAt)),
    );
}

/**
 * Mark a piece sold. Idempotent: Stripe retries webhooks, and the
 * `soldAt IS NULL` guard means a redelivery is a no-op rather than a
 * second sale record. Returns whether this call was the one that sold it.
 */
export async function markSold(
  slug: string,
  paymentIntentId: string | null,
): Promise<boolean> {
  const sold = await db
    .update(schema.galleryItems)
    .set({
      soldAt: new Date(),
      reservedUntil: null,
      stripePaymentIntentId: paymentIntentId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.galleryItems.slug, slug), isNull(schema.galleryItems.soldAt)),
    )
    .returning({ slug: schema.galleryItems.slug });
  return sold.length > 0;
}

/** Release a hold only if it still belongs to the expiring session. */
export async function releaseIfSession(
  slug: string,
  sessionId: string,
): Promise<void> {
  await db
    .update(schema.galleryItems)
    .set({ reservedUntil: null, stripeSessionId: null, updatedAt: new Date() })
    .where(
      and(
        eq(schema.galleryItems.slug, slug),
        eq(schema.galleryItems.stripeSessionId, sessionId),
        isNull(schema.galleryItems.soldAt),
      ),
    );
}

/** A checkout-capable view of a public piece, or undefined. */
export async function purchasablePiece(
  slug: string,
): Promise<ResolvedPiece | undefined> {
  const { pieces } = await getGalleryAdminView();
  const piece = pieces.find((p) => p.slug === slug);
  // Hidden pieces are not purchasable — the console took them off the
  // wall, and a stale checkout link must not be a side door.
  return piece && !piece.hidden ? piece : undefined;
}

/** Stable reference for logs and audit detail. */
export function newSaleRef(): string {
  return randomUUID();
}
