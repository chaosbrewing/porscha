"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * The 2FA verification form. Single input (works with paste and
 * autofill), numeric keyboard on mobile, recovery-code fallback.
 */
export function TwoFactorVerify() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "recovery">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          method: mode === "recovery" ? "recovery" : "totp",
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "That code didn't work. Try again.");
        setCode("");
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

  return (
    <form onSubmit={submit} className="mt-8">
      <label
        htmlFor="tfa-code"
        className="type-meta text-ink-faint block"
      >
        {mode === "totp" ? "Authenticator code" : "Recovery code"}
      </label>
      <input
        id="tfa-code"
        name="code"
        type="text"
        inputMode={mode === "totp" ? "numeric" : "text"}
        autoComplete="one-time-code"
        autoFocus
        required
        placeholder={mode === "totp" ? "123 456" : "XXXX-XXXX-XX"}
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
        className="mt-5 w-full rounded-[4px] bg-accent px-6 py-3.5 text-[0.9375rem] font-medium text-ink-inverse transition-colors duration-[var(--duration-micro)] hover:bg-accent-deep disabled:opacity-60"
      >
        {busy ? "Checking…" : "Verify"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "totp" ? "recovery" : "totp"));
          setCode("");
          setError(null);
        }}
        className="mt-4 w-full text-center text-sm text-ink-soft underline underline-offset-4 decoration-line-strong hover:text-ink"
      >
        {mode === "totp"
          ? "Use a recovery code instead"
          : "Use my authenticator instead"}
      </button>
    </form>
  );
}
