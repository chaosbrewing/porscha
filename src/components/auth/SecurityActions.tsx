"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Security page actions: regenerate recovery codes and replace the
 * authenticator. Both require a fresh TOTP challenge; neither offers a
 * casual way to switch 2FA off.
 */

function CodeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="type-meta text-ink-faint block">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123 456"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full max-w-[14rem] rounded-[4px] border border-line-strong bg-paper-raised px-3.5 py-2.5 font-mono text-base tracking-[0.15em]"
      />
    </div>
  );
}

export function RegenerateRecoveryCodes() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/recovery-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        recoveryCodes?: string[];
      };
      if (!res.ok || !json.recoveryCodes) {
        setError(json.error ?? "That code didn't work.");
        return;
      }
      setCodes(json.recoveryCodes);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
      setCode("");
    }
  }

  return (
    <div className="border border-line rounded-md px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">Regenerate recovery codes</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            Replaces every existing code with ten fresh ones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setCodes(null);
            setError(null);
          }}
          className="shrink-0 border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
        >
          {open ? "Close" : "Regenerate"}
        </button>
      </div>

      {open && !codes ? (
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-4">
          <CodeField
            id="regen-code"
            label="Current authenticator code"
            value={code}
            onChange={setCode}
          />
          <button
            type="submit"
            disabled={busy || !code}
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)] disabled:opacity-50"
          >
            {busy ? "Working…" : "Confirm"}
          </button>
          {error ? (
            <p role="alert" className="w-full text-sm text-alert">{error}</p>
          ) : null}
        </form>
      ) : null}

      {codes ? (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            Your new codes — shown once, save them now. The old ones no
            longer work.
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-[4px] border border-line bg-paper-raised px-4 py-3 font-mono text-sm sm:grid-cols-3">
            {codes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ReplaceAuthenticator() {
  const router = useRouter();
  const [step, setStep] = useState<"closed" | "challenge" | "confirm" | "done">(
    "closed",
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/replace/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        qrDataUrl?: string;
        manualKey?: string;
      };
      if (!res.ok || !json.qrDataUrl) {
        setError(json.error ?? "That code didn't work.");
        return;
      }
      setQr(json.qrDataUrl);
      setManualKey(json.manualKey ?? null);
      setStep("confirm");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
      setCode("");
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/replace/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "That code didn't work.");
        return;
      }
      setStep("done");
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
      setCode("");
    }
  }

  return (
    <div className="border border-line rounded-md px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">Replace authenticator</h3>
          <p className="mt-0.5 text-sm text-ink-soft">
            Move to a new device. Every other session gets signed out.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep((s) => (s === "closed" ? "challenge" : "closed"));
            setError(null);
            setCode("");
          }}
          className="shrink-0 border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
        >
          {step === "closed" ? "Replace" : "Close"}
        </button>
      </div>

      {step === "challenge" ? (
        <form onSubmit={start} className="mt-4 flex flex-wrap items-end gap-4">
          <CodeField
            id="replace-current"
            label="Code from your current authenticator"
            value={code}
            onChange={setCode}
          />
          <button
            type="submit"
            disabled={busy || !code}
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)] disabled:opacity-50"
          >
            {busy ? "Working…" : "Continue"}
          </button>
          {error ? (
            <p role="alert" className="w-full text-sm text-alert">{error}</p>
          ) : null}
        </form>
      ) : null}

      {step === "confirm" && qr ? (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            Scan with the new device, then confirm with the code it shows.
          </p>
          <div className="mt-3 inline-block rounded-[6px] border border-line bg-white p-2.5">
            <Image
              src={qr}
              alt="QR code for the replacement authenticator"
              width={180}
              height={180}
              unoptimized
            />
          </div>
          {manualKey ? (
            <details className="mt-2 text-sm text-ink-soft">
              <summary className="cursor-pointer underline underline-offset-4 decoration-line-strong">
                Manual key
              </summary>
              <code className="mt-1 block break-all rounded border border-line bg-paper-raised px-3 py-2 font-mono text-xs">
                {manualKey}
              </code>
            </details>
          ) : null}
          <form onSubmit={confirm} className="mt-4 flex flex-wrap items-end gap-4">
            <CodeField
              id="replace-new"
              label="Code from the new authenticator"
              value={code}
              onChange={setCode}
            />
            <button
              type="submit"
              disabled={busy || !code}
              className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)] disabled:opacity-50"
            >
              {busy ? "Working…" : "Switch over"}
            </button>
            {error ? (
              <p role="alert" className="w-full text-sm text-alert">{error}</p>
            ) : null}
          </form>
        </div>
      ) : null}

      {step === "done" ? (
        <p className="mt-4 rounded border border-ok/40 bg-ok-wash px-4 py-2.5 text-sm">
          Done. The new authenticator is active and every other session has
          been signed out.
        </p>
      ) : null}
    </div>
  );
}
