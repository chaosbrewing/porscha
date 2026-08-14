import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./verify";

const SECRET = "test-secret";
const BODY = JSON.stringify({ hello: "world" });

function sign(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

describe("verifyWebhookSignature", () => {
  it("accepts a correctly signed body", () => {
    expect(verifyWebhookSignature(SECRET, BODY, sign(SECRET, BODY))).toBe(true);
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(verifyWebhookSignature(SECRET, BODY, sign("wrong", BODY))).toBe(
      false,
    );
  });

  it("rejects a signature for a different body", () => {
    expect(
      verifyWebhookSignature(SECRET, BODY, sign(SECRET, "tampered")),
    ).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(verifyWebhookSignature(SECRET, BODY, null)).toBe(false);
  });

  it("rejects malformed headers", () => {
    expect(verifyWebhookSignature(SECRET, BODY, "sha1=abc")).toBe(false);
    expect(verifyWebhookSignature(SECRET, BODY, "sha256=")).toBe(false);
    expect(verifyWebhookSignature(SECRET, BODY, "sha256=nothex!!")).toBe(false);
    expect(verifyWebhookSignature(SECRET, BODY, "garbage")).toBe(false);
  });
});
