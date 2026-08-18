import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { aspectFrom, readDimensions } from "./dimensions";

/**
 * Header parsing is the only thing standing between an upload and a
 * correctly proportioned tile, now that the console no longer asks for
 * an aspect ratio. Exercised against the real brand files in the repo
 * so the parsers are checked against actual encoder output, not
 * hand-built fixtures that only prove the test author's assumptions.
 */

function bytesOf(file: string): ArrayBuffer {
  const b = fs.readFileSync(path.join(process.cwd(), file));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

describe("readDimensions", () => {
  it("reads a real PNG header", () => {
    const d = readDimensions("image/png", bytesOf("public/brand/porscha-logo.png"));
    expect(d).toEqual({ width: 1536, height: 1024 });
  });

  it("reads a real JPEG SOF frame", () => {
    const d = readDimensions("image/jpeg", bytesOf("public/brand/obra-mark.jpg"));
    expect(d?.width).toBeGreaterThan(0);
    expect(d?.height).toBeGreaterThan(0);
    // The OBRA mark is square.
    expect(d!.width).toBe(d!.height);
  });

  it("reads an SVG viewBox", () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"></svg>',
    );
    expect(readDimensions("image/svg+xml", svg.buffer as ArrayBuffer)).toEqual({
      width: 300,
      height: 200,
    });
  });

  it("falls back to SVG width/height attributes", () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40px" height="80px"></svg>',
    );
    expect(readDimensions("image/svg+xml", svg.buffer as ArrayBuffer)).toEqual({
      width: 40,
      height: 80,
    });
  });

  it("returns null rather than guessing at a malformed file", () => {
    const junk = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(readDimensions("image/png", junk.buffer as ArrayBuffer)).toBeNull();
    expect(readDimensions("image/jpeg", junk.buffer as ArrayBuffer)).toBeNull();
    expect(readDimensions("image/gif", junk.buffer as ArrayBuffer)).toBeNull();
  });
});

describe("aspectFrom", () => {
  it("reduces to a readable ratio", () => {
    expect(aspectFrom({ width: 1536, height: 1024 })).toBe("3/2");
    expect(aspectFrom({ width: 800, height: 1000 })).toBe("4/5");
    expect(aspectFrom({ width: 1024, height: 1024 })).toBe("1/1");
  });

  it("falls back when the file would not say", () => {
    expect(aspectFrom(null)).toBe("4/5");
    expect(aspectFrom({ width: 0, height: 10 })).toBe("4/5");
  });

  it("keeps an awkward ratio short rather than exact", () => {
    // 1907/2543 reduces to itself; a decimal ratio stays legible.
    expect(aspectFrom({ width: 1907, height: 2543 })).toBe("0.750/1");
  });
});
