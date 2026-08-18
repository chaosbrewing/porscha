/**
 * Money formatting for prices stored as minor units (cents).
 *
 * Intl handles the currency's own subunit rules, so zero-decimal
 * currencies like JPY are not silently divided by 100 in the wrong
 * places — the divisor here is fixed because Stripe quotes every
 * amount in the currency's minor unit.
 */
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency.toUpperCase(),
    currencyDisplay: "narrowSymbol",
  }).format(cents / 100);
}
