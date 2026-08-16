import { describe, expect, it } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  hashRecoveryCode,
} from "./secret-crypto";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);

describe("secret encryption (AES-256-GCM)", () => {
  it("round-trips a TOTP secret", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    expect(decryptSecret(stored, KEY_A)).toBe("JBSWY3DPEHPK3PXP");
  });

  it("never stores the plaintext", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    expect(stored).not.toContain("JBSWY3DPEHPK3PXP");
  });

  it("produces distinct ciphertexts per call (fresh IV)", () => {
    const a = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    const b = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong key", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    expect(() => decryptSecret(stored, KEY_B)).toThrow();
  });

  it("fails on tampered ciphertext (authenticated encryption)", () => {
    const stored = encryptSecret("JBSWY3DPEHPK3PXP", KEY_A);
    const parts = stored.split(".");
    const data = Buffer.from(parts[3], "base64");
    data[0] ^= 0xff;
    parts[3] = data.toString("base64");
    expect(() => decryptSecret(parts.join("."), KEY_A)).toThrow();
  });
});

describe("hashRecoveryCode", () => {
  it("normalizes spacing, dashes, and case", () => {
    expect(hashRecoveryCode("k7gt-m2qd-4w")).toBe(
      hashRecoveryCode("K7GT M2QD 4W"),
    );
  });

  it("is not the identity function", () => {
    expect(hashRecoveryCode("K7GT-M2QD-4W")).not.toContain("K7GT");
  });
});
