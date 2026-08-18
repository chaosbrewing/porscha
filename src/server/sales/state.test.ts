import { describe, expect, it } from "vitest";
import { saleStateOf } from "./service";

/**
 * Sale-state derivation for one-off originals. The ordering matters:
 * sold outranks everything, and a lapsed hold must read as available
 * rather than stranding a piece nobody can buy.
 */

const base = {
  forSale: true,
  priceCents: 85_000,
  currency: "AUD",
  soldAt: null as Date | null,
  reservedUntil: null as Date | null,
};

describe("saleStateOf", () => {
  it("reports a listed, unreserved piece as available", () => {
    expect(saleStateOf(base)).toEqual({
      status: "available",
      priceCents: 85_000,
      currency: "AUD",
    });
  });

  it("reports a piece not offered for sale", () => {
    expect(saleStateOf({ ...base, forSale: false }).status).toBe("not_for_sale");
  });

  it("treats a listing with no price as not for sale", () => {
    expect(saleStateOf({ ...base, priceCents: null }).status).toBe("not_for_sale");
    expect(saleStateOf({ ...base, priceCents: 0 }).status).toBe("not_for_sale");
  });

  it("reports an active reservation as held", () => {
    const future = new Date(Date.now() + 10 * 60_000);
    expect(saleStateOf({ ...base, reservedUntil: future }).status).toBe("held");
  });

  it("frees a lapsed reservation back to available", () => {
    const past = new Date(Date.now() - 60_000);
    expect(saleStateOf({ ...base, reservedUntil: past }).status).toBe("available");
  });

  it("reports sold regardless of the other flags", () => {
    const sold = {
      ...base,
      soldAt: new Date(),
      forSale: false,
      reservedUntil: new Date(Date.now() + 60_000),
    };
    expect(saleStateOf(sold).status).toBe("sold");
  });

  it("falls back to the configured currency", () => {
    const state = saleStateOf({ ...base, currency: null });
    expect(state.status).toBe("available");
    if (state.status === "available") expect(state.currency).toBe("AUD");
  });
});
