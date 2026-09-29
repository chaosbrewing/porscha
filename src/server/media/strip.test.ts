import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readDimensions } from "./dimensions";
import { stripImageMetadata } from "./strip";

function bytesOf(file: string): Uint8Array {
  return new Uint8Array(fs.readFileSync(path.join(process.cwd(), file)));
}

function toBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

/** A JPEG with an APP1 EXIF segment spliced in after SOI. */
function jpegWithExif(): { withExif: Uint8Array; exifPayload: Uint8Array } {
  const clean = bytesOf("public/portrait/porscha.jpg");
  const payload = new TextEncoder().encode("Exif\0\0GPSLatitude=-37.8136");
  const len = payload.length + 2;
  const seg = new Uint8Array(4 + payload.length);
  seg.set([0xff, 0xe1, (len >> 8) & 0xff, len & 0xff], 0);
  seg.set(payload, 4);
  const out = new Uint8Array(clean.length + seg.length);
  out.set(clean.subarray(0, 2), 0);
  out.set(seg, 2);
  out.set(clean.subarray(2), 2 + seg.length);
  return { withExif: out, exifPayload: payload };
}

function contains(hay: Uint8Array, needle: string): boolean {
  const n = new TextEncoder().encode(needle);
  outer: for (let i = 0; i + n.length <= hay.length; i++) {
    for (let j = 0; j < n.length; j++) if (hay[i + j] !== n[j]) continue outer;
    return true;
  }
  return false;
}

describe("stripImageMetadata", () => {
  it("removes an EXIF segment from a JPEG and leaves the picture readable", () => {
    const { withExif } = jpegWithExif();
    expect(contains(withExif, "GPSLatitude")).toBe(true);
    const stripped = new Uint8Array(stripImageMetadata("image/jpeg", toBuffer(withExif)));
    expect(contains(stripped, "GPSLatitude")).toBe(false);
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
    expect(readDimensions("image/jpeg", toBuffer(stripped))).toEqual({
      width: 941,
      height: 1672,
    });
  });

  it("leaves a JPEG without metadata byte-identical", () => {
    const clean = bytesOf("public/portrait/porscha.jpg");
    const out = new Uint8Array(stripImageMetadata("image/jpeg", toBuffer(clean)));
    expect(out.length).toBe(clean.length);
  });

  it("removes text and EXIF chunks from a PNG", () => {
    const clean = bytesOf("public/og/porscha.png");
    // Splice a tEXt chunk after IHDR (8-byte signature + 25-byte IHDR).
    const text = new TextEncoder().encode("Comment\0shot at home");
    const chunk = new Uint8Array(12 + text.length);
    chunk.set([0, 0, 0, text.length], 0);
    chunk.set([0x74, 0x45, 0x58, 0x74], 4); // tEXt
    chunk.set(text, 8);
    const withText = new Uint8Array(clean.length + chunk.length);
    withText.set(clean.subarray(0, 33), 0);
    withText.set(chunk, 33);
    withText.set(clean.subarray(33), 33 + chunk.length);
    expect(contains(withText, "shot at home")).toBe(true);

    const stripped = new Uint8Array(stripImageMetadata("image/png", toBuffer(withText)));
    expect(contains(stripped, "shot at home")).toBe(false);
    expect(readDimensions("image/png", toBuffer(stripped))).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("removes EXIF and XMP chunks from a WebP and clears the VP8X flags", () => {
    const enc = (s: string) => new TextEncoder().encode(s);
    const chunk = (type: string, data: Uint8Array) => {
      const padded = data.length + (data.length & 1);
      const c = new Uint8Array(8 + padded);
      c.set(enc(type), 0);
      c[4] = data.length & 0xff;
      c[5] = (data.length >> 8) & 0xff;
      c.set(data, 8);
      return c;
    };
    const vp8x = chunk("VP8X", new Uint8Array([0x0c, 0, 0, 0, 9, 0, 0, 9, 0, 0]));
    const exif = chunk("EXIF", enc("GPS here"));
    const xmp = chunk("XMP ", enc("<x:xmpmeta/>"));
    const vp8 = chunk("VP8 ", new Uint8Array(10));
    const parts = [vp8x, exif, xmp, vp8];
    const bodyLen = parts.reduce((n, p) => n + p.length, 0);
    const file = new Uint8Array(12 + bodyLen);
    file.set(enc("RIFF"), 0);
    file[4] = (4 + bodyLen) & 0xff;
    file.set(enc("WEBP"), 8);
    let o = 12;
    for (const p of parts) {
      file.set(p, o);
      o += p.length;
    }

    const stripped = new Uint8Array(stripImageMetadata("image/webp", toBuffer(file)));
    expect(contains(stripped, "GPS here")).toBe(false);
    expect(contains(stripped, "xmpmeta")).toBe(false);
    expect(contains(stripped, "VP8X")).toBe(true);
    // Flags byte sits at offset 12 (RIFF header) + 8 (chunk header).
    expect(stripped[20] & 0x0c).toBe(0);
    const riffLen = stripped[4] | (stripped[5] << 8);
    expect(riffLen).toBe(stripped.length - 8);
  });

  it("passes SVG and unknown types through untouched", () => {
    const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>");
    expect(new Uint8Array(stripImageMetadata("image/svg+xml", toBuffer(svg)))).toEqual(svg);
  });
});
