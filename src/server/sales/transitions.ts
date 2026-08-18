/**
 * Sale-transition decisions for one-off originals.
 *
 * These predicates are the *specification* of when a gallery item may
 * change hands. The service enforces the identical conditions inside
 * single atomic UPDATE statements — the database, not the app, decides
 * races. They live here as pure functions so the invariants can be
 * tested exhaustively without a database, and so the rule is stated in
 * one readable place rather than only inside SQL.
 *
 * The governing invariant is **session ownership**:
 *
 *   A paid Checkout Session may mark an item sold only if that exact
 *   session still owns the item's reservation.
 *
 * `sold_at IS NULL` alone is not sufficient. A reservation can lapse
 * and be re-acquired by a different buyer; a late webhook from the
 * abandoned session must not then sell the piece out from under the
 * current holder.
 */

export type SaleRow = {
  slug: string;
  forSale: boolean;
  priceCents: number | null;
  soldAt: Date | null;
  reservedUntil: Date | null;
  stripeSessionId: string | null;
};

export type ClaimDecision = "claim" | "sold" | "held" | "not_for_sale";

/** Whether a fresh checkout may take the piece. */
export function decideClaim(row: SaleRow, now: Date): ClaimDecision {
  if (row.soldAt !== null) return "sold";
  if (!row.forSale || row.priceCents === null || row.priceCents <= 0) {
    return "not_for_sale";
  }
  if (row.reservedUntil !== null && row.reservedUntil > now) return "held";
  return "claim";
}

export type SaleDecision = "sell" | "already_sold" | "not_session_owner";

/**
 * Whether a paid webhook may mark the piece sold.
 *
 * `not_session_owner` covers both the late-session case (the hold has
 * moved to another buyer) and the never-attached case (a session whose
 * id was never recorded against this item).
 */
export function decideSale(row: SaleRow, eventSessionId: string): SaleDecision {
  if (row.soldAt !== null) return "already_sold";
  if (row.stripeSessionId === null) return "not_session_owner";
  if (row.stripeSessionId !== eventSessionId) return "not_session_owner";
  return "sell";
}

export type ReleaseDecision = "release" | "already_sold" | "not_session_owner";

/**
 * Whether an expiry/failure webhook may clear the hold. An old session
 * expiring must never free a newer buyer's reservation, so this is
 * gated on the same ownership check as the sale.
 */
export function decideRelease(
  row: SaleRow,
  eventSessionId: string,
): ReleaseDecision {
  if (row.soldAt !== null) return "already_sold";
  if (row.stripeSessionId !== eventSessionId) return "not_session_owner";
  return "release";
}

/**
 * Whether a failed checkout-creation may roll back its own claim.
 *
 * Identity here is the reservation instant this request wrote, because
 * no Stripe session id exists yet to identify it by. A newer claim
 * carries a different `reservedUntil`, so it is left alone — the
 * rollback can only ever undo the claim that made it.
 */
export function decideClaimRollback(
  row: SaleRow,
  expectedReservedUntil: Date,
): "release" | "ignore" {
  if (row.soldAt !== null) return "ignore";
  if (row.reservedUntil === null) return "ignore";
  if (row.reservedUntil.getTime() !== expectedReservedUntil.getTime()) {
    return "ignore";
  }
  return "release";
}
