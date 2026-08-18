"use client";

import { useState } from "react";

/**
 * Purchase control for a one-off original.
 *
 * Clicking asks the server to reserve the piece and open a Stripe
 * checkout; the redirect only happens if the reservation was won. No
 * card details are handled here or anywhere on this site — Stripe's
 * hosted page takes them.
 */

export type SaleView =
  | { status: "available"; price: string }
  | { status: "held"; price: string }
  | { status: "sold"; price: string | null };

export function BuyOriginal({
  slug,
  sale,
}: {
  slug: string;
  sale: SaleView;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sale.status === "sold") {
    return (
      <p className="flex flex-col gap-1">
        <span className="type-kicker text-accent">Sold</span>
        <span className="type-caption">
          Original · one of one{sale.price ? ` · ${sale.price}` : ""}
        </span>
      </p>
    );
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallery/${slug}/buy`, { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Couldn't start checkout.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="flex flex-col gap-1">
        <span className="type-heading text-2xl">{sale.price}</span>
        <span className="type-kicker text-ink-faint">
          Original · one of one
        </span>
      </p>

      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="mt-5 inline-flex items-center bg-accent px-6 py-3.5 type-kicker text-accent-on hover:bg-accent-deep disabled:opacity-60 transition-colors duration-[var(--duration-micro)]"
      >
        {busy ? "Opening checkout…" : "Buy this original"}
      </button>

      <p className="type-caption mt-3">
        Secure checkout by Stripe. Shipping collected at checkout.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
