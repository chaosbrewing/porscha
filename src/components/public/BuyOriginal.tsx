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
      <p className="mt-8 border-t border-line pt-6">
        <span className="type-meta text-ink-faint">Original · Sold</span>
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
    <div className="mt-8 border-t border-line pt-6">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="type-heading text-xl">{sale.price}</span>
        <span className="type-meta text-ink-faint">
          Original · one of one
        </span>
      </p>

      <button
        type="button"
        onClick={buy}
        disabled={busy}
        className="mt-4 inline-flex items-center rounded-[4px] bg-accent px-5 py-3 text-sm font-medium text-ink-inverse hover:bg-accent-deep disabled:opacity-60 transition-colors duration-[var(--duration-micro)]"
      >
        {busy ? "Opening checkout…" : "Buy this original"}
      </button>

      <p className="mt-3 text-xs text-ink-faint">
        Secure checkout by Stripe. Shipping collected at checkout.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
