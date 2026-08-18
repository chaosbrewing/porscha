import "server-only";
import { env } from "@/server/env";

/**
 * Thin Stripe REST client — no SDK, matching the hand-rolled GitHub
 * client. The Stripe API is form-encoded HTTP; the official package
 * would add a large dependency for the three calls this app makes.
 *
 * Server-only. The secret key never leaves this process, and no card
 * data ever touches this site: buyers are sent to Stripe's own hosted
 * checkout page.
 */

const API = "https://api.stripe.com/v1";

export class StripeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

/**
 * Stripe takes nested params as `a[b][0][c]` form fields, not JSON.
 */
function encode(
  value: unknown,
  prefix = "",
  out: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  if (value === null || value === undefined) return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => encode(v, `${prefix}[${i}]`, out));
  } else if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      encode(v, prefix ? `${prefix}[${k}]` : k, out);
    }
  } else {
    out.append(prefix, String(value));
  }
  return out;
}

async function stripe<T>(
  path: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string,
): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) {
    throw new StripeError("Stripe is not configured", 0);
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? encode(body).toString() : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as
    | T
    | { error?: { message?: string; type?: string } };
  if (!res.ok) {
    const message =
      (json as { error?: { message?: string } }).error?.message ??
      `Stripe request failed (${res.status})`;
    throw new StripeError(message, res.status);
  }
  return json as T;
}

export type CheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
};

/**
 * One-off original: a single line item priced inline. No Product or
 * Price objects are pre-created — each piece sells once, so a catalogue
 * in Stripe would be bookkeeping with no reader.
 */
export async function createCheckoutSession(input: {
  slug: string;
  title: string;
  priceCents: number;
  currency: string;
  imageUrl?: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}): Promise<CheckoutSession> {
  return stripe<CheckoutSession>(
    "/checkout/sessions",
    {
      mode: "payment",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // Originals ship, so Stripe collects the address.
      shipping_address_collection: { allowed_countries: ["AU", "NZ", "GB", "US", "CA", "IE"] },
      // Expiry is what eventually frees an abandoned checkout.
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.priceCents,
            product_data: {
              name: input.title,
              ...(input.imageUrl ? { images: [input.imageUrl] } : {}),
            },
          },
        },
      ],
      // The webhook trusts this, not the browser's return trip.
      metadata: { gallery_slug: input.slug },
    },
    input.idempotencyKey,
  );
}

export async function retrieveCheckoutSession(
  id: string,
): Promise<CheckoutSession> {
  return stripe<CheckoutSession>(`/checkout/sessions/${encodeURIComponent(id)}`);
}
