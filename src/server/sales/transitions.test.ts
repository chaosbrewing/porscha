import { describe, expect, it } from "vitest";
import {
  decideClaim,
  decideClaimRollback,
  decideRelease,
  decideSale,
  type SaleRow,
} from "./transitions";

/**
 * Sale-ownership invariant tests.
 *
 * These encode the rule the SQL enforces: a paid Checkout Session may
 * mark an item sold only if that exact session still owns the item's
 * reservation. A failure here means a piece could be sold twice, or
 * sold to the wrong buyer — treat them as release blockers.
 */

const SESSION_A = "cs_test_A";
const SESSION_B = "cs_test_B";

function row(over: Partial<SaleRow> = {}): SaleRow {
  return {
    slug: "reservoir-walk",
    forSale: true,
    priceCents: 85_000,
    soldAt: null,
    reservedUntil: null,
    stripeSessionId: null,
    ...over,
  };
}

describe("decideClaim", () => {
  const now = new Date("2026-08-18T12:00:00Z");

  it("allows a claim on an unreserved, priced, unsold piece", () => {
    expect(decideClaim(row(), now)).toBe("claim");
  });

  it("refuses a sold piece", () => {
    expect(decideClaim(row({ soldAt: new Date() }), now)).toBe("sold");
  });

  it("refuses a piece not offered, or offered without a price", () => {
    expect(decideClaim(row({ forSale: false }), now)).toBe("not_for_sale");
    expect(decideClaim(row({ priceCents: null }), now)).toBe("not_for_sale");
    expect(decideClaim(row({ priceCents: 0 }), now)).toBe("not_for_sale");
  });

  it("refuses while another checkout holds it", () => {
    const future = new Date(now.getTime() + 60_000);
    expect(decideClaim(row({ reservedUntil: future }), now)).toBe("held");
  });

  it("allows a claim once the hold has lapsed", () => {
    const past = new Date(now.getTime() - 1);
    expect(decideClaim(row({ reservedUntil: past }), now)).toBe("claim");
  });
});

describe("decideSale — session ownership", () => {
  it("sells when the paying session still owns the reservation", () => {
    expect(decideSale(row({ stripeSessionId: SESSION_A }), SESSION_A)).toBe("sell");
  });

  it("refuses a session that does not own the reservation", () => {
    expect(decideSale(row({ stripeSessionId: SESSION_B }), SESSION_A)).toBe(
      "not_session_owner",
    );
  });

  it("refuses when no session owns the reservation", () => {
    expect(decideSale(row({ stripeSessionId: null }), SESSION_A)).toBe(
      "not_session_owner",
    );
  });

  it("is a no-op on redelivery once sold", () => {
    const sold = row({ stripeSessionId: SESSION_A, soldAt: new Date() });
    expect(decideSale(sold, SESSION_A)).toBe("already_sold");
  });

  /**
   * The scenario this invariant exists for. `sold_at IS NULL` alone
   * would let A win here, selling a piece B currently holds.
   */
  it("does not let a late payment from a lapsed session take the piece", () => {
    const t0 = new Date("2026-08-18T12:00:00Z");

    // A reserves and opens a checkout.
    let piece = row({
      reservedUntil: new Date(t0.getTime() + 30 * 60_000),
      stripeSessionId: SESSION_A,
    });
    expect(decideSale(piece, SESSION_A)).toBe("sell");

    // A abandons it; 31 minutes later the hold has lapsed.
    const t1 = new Date(t0.getTime() + 31 * 60_000);
    expect(decideClaim(piece, t1)).toBe("claim");

    // B claims it. The claim clears A's session id — without that,
    // A's id would linger and satisfy the ownership check below.
    piece = {
      ...piece,
      reservedUntil: new Date(t1.getTime() + 30 * 60_000),
      stripeSessionId: null,
    };
    // B's checkout opens and takes ownership.
    piece = { ...piece, stripeSessionId: SESSION_B };

    // A's late paid webhook finally arrives. It must not sell.
    expect(decideSale(piece, SESSION_A)).toBe("not_session_owner");

    // B's reservation is untouched and still authoritative.
    expect(piece.stripeSessionId).toBe(SESSION_B);
    expect(piece.soldAt).toBeNull();
    expect(decideClaim(piece, t1)).toBe("held");

    // And B's own payment goes through.
    expect(decideSale(piece, SESSION_B)).toBe("sell");
  });
});

describe("decideRelease — stale expiry and failure", () => {
  it("releases when the expiring session owns the hold", () => {
    expect(decideRelease(row({ stripeSessionId: SESSION_A }), SESSION_A)).toBe(
      "release",
    );
  });

  it("does not let a stale expiry free a newer buyer's hold", () => {
    const heldByB = row({ stripeSessionId: SESSION_B });
    expect(decideRelease(heldByB, SESSION_A)).toBe("not_session_owner");
  });

  it("does not let a stale async failure free a newer buyer's hold", () => {
    // Same predicate backs async_payment_failed; asserted separately
    // because the two events arrive from different flows.
    const heldByB = row({
      stripeSessionId: SESSION_B,
      reservedUntil: new Date(Date.now() + 60_000),
    });
    expect(decideRelease(heldByB, SESSION_A)).toBe("not_session_owner");
    expect(heldByB.stripeSessionId).toBe(SESSION_B);
  });

  it("leaves a sold piece alone", () => {
    const sold = row({ stripeSessionId: SESSION_A, soldAt: new Date() });
    expect(decideRelease(sold, SESSION_A)).toBe("already_sold");
  });
});

describe("decideClaimRollback — failed checkout creation", () => {
  const until = new Date("2026-08-18T12:30:00Z");

  it("releases the claim it just made", () => {
    expect(decideClaimRollback(row({ reservedUntil: until }), until)).toBe(
      "release",
    );
  });

  it("never clears a newer reservation", () => {
    const newer = new Date(until.getTime() + 60_000);
    expect(decideClaimRollback(row({ reservedUntil: newer }), until)).toBe(
      "ignore",
    );
  });

  it("is idempotent once released", () => {
    expect(decideClaimRollback(row({ reservedUntil: null }), until)).toBe(
      "ignore",
    );
  });

  it("leaves a sold piece alone", () => {
    const sold = row({ reservedUntil: until, soldAt: new Date() });
    expect(decideClaimRollback(sold, until)).toBe("ignore");
  });
});
