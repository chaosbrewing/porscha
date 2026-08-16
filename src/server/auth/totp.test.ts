import { describe, expect, it } from "vitest";
import * as OTPAuth from "otpauth";
import {
  generateRecoveryCode,
  generateTotpSecret,
  provisioningUri,
  verifyTotpCode,
} from "./twofactor";

function codeFor(secret: string, atMs: number): string {
  return new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  }).generate({ timestamp: atMs });
}

describe("TOTP verification", () => {
  const secret = generateTotpSecret();
  const now = 1_800_000_000_000; // fixed instant

  it("accepts the current code", () => {
    expect(verifyTotpCode(secret, codeFor(secret, now), now)).not.toBeNull();
  });

  it("accepts codes one step either side (clock skew)", () => {
    expect(
      verifyTotpCode(secret, codeFor(secret, now - 30_000), now),
    ).not.toBeNull();
    expect(
      verifyTotpCode(secret, codeFor(secret, now + 30_000), now),
    ).not.toBeNull();
  });

  it("rejects codes outside the window", () => {
    expect(verifyTotpCode(secret, codeFor(secret, now - 90_000), now)).toBeNull();
    expect(verifyTotpCode(secret, codeFor(secret, now + 90_000), now)).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(verifyTotpCode(secret, "abc123", now)).toBeNull();
    expect(verifyTotpCode(secret, "12345", now)).toBeNull();
    expect(verifyTotpCode(secret, "", now)).toBeNull();
  });

  it("tolerates whitespace in the code", () => {
    const code = codeFor(secret, now);
    expect(
      verifyTotpCode(secret, `${code.slice(0, 3)} ${code.slice(3)}`, now),
    ).not.toBeNull();
  });

  it("returns the matched counter for replay tracking", () => {
    const counter = verifyTotpCode(secret, codeFor(secret, now), now);
    expect(counter).toBe(Math.floor(now / 1000 / 30));
  });
});

describe("provisioning", () => {
  it("builds an otpauth:// URI naming the site and account", () => {
    const secret = generateTotpSecret();
    const uri = provisioningUri(secret, "chaosbrewing");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain("porscha.today");
    expect(uri).toContain("chaosbrewing");
    expect(uri).toContain(secret);
  });

  it("generates distinct 160-bit secrets", () => {
    const a = generateTotpSecret();
    const b = generateTotpSecret();
    expect(a).not.toBe(b);
    expect(a.length).toBe(32); // 20 bytes base32
  });
});

describe("recovery code generation", () => {
  it("uses the XXXX-XXXX-XX shape without confusable characters", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateRecoveryCode();
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);
      expect(code).not.toMatch(/[01ILO]/);
    }
  });
});
