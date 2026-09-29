import { afterEach, describe, expect, it } from "vitest";
import { cronRequestIsTrusted, cronToken } from "./cron";

const g = globalThis as Record<string, unknown>;

afterEach(() => {
  delete g.__porschaCronToken;
});

describe("scheduled sync trust", () => {
  it("is unavailable when the entry has set no token", () => {
    expect(cronToken()).toBeUndefined();
    expect(cronRequestIsTrusted("anything")).toBe(false);
  });

  it("accepts only the exact token", () => {
    g.__porschaCronToken = "0123456789abcdef0123456789abcdef";
    expect(cronRequestIsTrusted("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(cronRequestIsTrusted("0123456789abcdef0123456789abcdeF")).toBe(false);
    expect(cronRequestIsTrusted("")).toBe(false);
    expect(cronRequestIsTrusted(null)).toBe(false);
  });

  it("ignores a token too short to be the entry's", () => {
    g.__porschaCronToken = "short";
    expect(cronToken()).toBeUndefined();
  });
});
