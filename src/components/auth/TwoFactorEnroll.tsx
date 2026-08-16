"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 2FA enrollment: scan the QR (or use the manual key), confirm a code,
 * save the one-time recovery codes, acknowledge, continue.
 */
export function TwoFactorEnroll({
  qrDataUrl,
  manualKey,
}: {
  qrDataUrl: string;
  manualKey: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  async function enroll(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        recoveryCodes?: string[];
      };
      if (!res.ok || !json.ok || !json.recoveryCodes) {
        setError(json.error ?? "That code didn't match. Try again.");
        setCode("");
        return;
      }
      setRecoveryCodes(json.recoveryCodes);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function acknowledge() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/acknowledge", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; redirectTo?: string };
      if (!res.ok || !json.ok) {
        setError("Something went sideways. Refresh and try again.");
        return;
      }
      router.push(json.redirectTo ?? "/console/overview");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (recoveryCodes) {
    return (
      <div className="mt-8">
        <h2 className="type-heading text-xl">Your recovery codes</h2>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          If you lose your authenticator, one of these gets you back in.
          Each works exactly once, and this is the only time they&rsquo;ll be
          shown. Keep them somewhere safe and offline.
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 rounded-[4px] border border-line bg-paper-raised px-5 py-4 font-mono text-sm">
          {recoveryCodes.map((rc) => (
            <li key={rc}>{rc}</li>
          ))}
        </ul>
        <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 size-4 accent-[var(--color-accent)]"
          />
          I&rsquo;ve saved these codes somewhere safe.
        </label>
        {error ? (
          <p role="alert" className="mt-3 rounded border border-alert/40 bg-alert-wash px-4 py-2.5 text-sm">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!acknowledged || busy}
          onClick={acknowledge}
          className="mt-5 w-full rounded-[4px] bg-accent px-6 py-3.5 text-[0.9375rem] font-medium text-ink-inverse transition-colors duration-[var(--duration-micro)] hover:bg-accent-deep disabled:opacity-50"
        >
          {busy ? "One moment…" : "Enter the console"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <ol className="space-y-6">
        <li className="flex gap-4">
          <span aria-hidden="true" className="type-meta text-accent-deep mt-1">1</span>
          <div>
            <p className="text-sm leading-relaxed">
              Scan this with your authenticator app (1Password, Authy,
              Google Authenticator — anything TOTP).
            </p>
            <div className="mt-4 inline-block rounded-[6px] border border-line bg-white p-3">
              <Image
                src={qrDataUrl}
                alt="QR code for enrolling porscha.today in an authenticator app"
                width={200}
                height={200}
                unoptimized
              />
            </div>
            <details className="mt-3 text-sm text-ink-soft">
              <summary className="cursor-pointer underline underline-offset-4 decoration-line-strong">
                Can&rsquo;t scan? Enter the key manually
              </summary>
              <code className="mt-2 block break-all rounded border border-line bg-paper-raised px-3 py-2 font-mono text-xs">
                {manualKey}
              </code>
            </details>
          </div>
        </li>
        <li className="flex gap-4">
          <span aria-hidden="true" className="type-meta text-accent-deep mt-1">2</span>
          <form onSubmit={enroll} className="flex-1">
            <label htmlFor="enroll-code" className="text-sm leading-relaxed block">
              Enter the six-digit code it shows.
            </label>
            <input
              id="enroll-code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              placeholder="123 456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-2 w-full rounded-[4px] border border-line-strong bg-paper-raised px-4 py-3.5 font-mono text-xl tracking-[0.2em] text-ink placeholder:text-ink-faint placeholder:tracking-normal"
            />
            {error ? (
              <p role="alert" className="mt-3 rounded border border-alert/40 bg-alert-wash px-4 py-2.5 text-sm">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full rounded-[4px] bg-accent px-6 py-3.5 text-[0.9375rem] font-medium text-ink-inverse transition-colors duration-[var(--duration-micro)] hover:bg-accent-deep disabled:opacity-60"
            >
              {busy ? "Checking…" : "Confirm"}
            </button>
          </form>
        </li>
      </ol>
    </div>
  );
}
