/**
 * Intrinsic image dimensions, read from the file's own header.
 *
 * The console no longer asks for an aspect ratio — typing one is busy
 * work the file already knows the answer to. The masonry layout still
 * needs a ratio to reserve space before the image loads, so it is
 * derived here at upload time.
 *
 * Header parsing only: a few dozen bytes for raster formats, and the
 * `viewBox` for SVG. No decoding, no dependency, and safe in the
 * Workers runtime where an image library would not be.
 *
 * Returns null when the file is malformed or the format hides its size
 * (some SVGs genuinely have no intrinsic ratio); callers fall back.
 */

export type Dimensions = { width: number; height: number };

function png(bytes: Uint8Array): Dimensions | null {
  // 8-byte signature, then an IHDR chunk whose 8th..16th bytes are the
  // big-endian width and height.
  if (bytes.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((b, i) => bytes[i] === b)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpeg(bytes: Uint8Array): Dimensions | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    // SOF0..SOF15, excluding the non-frame markers DHT/JPG/DAC.
    const isFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isFrame) {
      return {
        height: view.getUint16(offset + 5),
        width: view.getUint16(offset + 7),
      };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    offset += 2 + view.getUint16(offset + 2);
  }
  return null;
}

function webp(bytes: Uint8Array): Dimensions | null {
  if (bytes.length < 30) return null;
  const tag = (at: number, s: string) =>
    [...s].every((c, i) => bytes[at + i] === c.charCodeAt(0));
  if (!tag(0, "RIFF") || !tag(8, "WEBP")) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (tag(12, "VP8X")) {
    // 24-bit little-endian, stored as (dimension - 1).
    const w = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const h = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width: w, height: h };
  }
  if (tag(12, "VP8L")) {
    const bits = view.getUint32(21, true);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (tag(12, "VP8 ")) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  return null;
}

function svg(text: string): Dimensions | null {
  const viewBox = text.match(
    /viewBox\s*=\s*["']\s*[-\d.eE]+[,\s]+[-\d.eE]+[,\s]+([\d.eE]+)[,\s]+([\d.eE]+)/,
  );
  if (viewBox) {
    const width = Number(viewBox[1]);
    const height = Number(viewBox[2]);
    if (width > 0 && height > 0) return { width, height };
  }
  // Fall back to plain width/height attributes when they are unitless
  // or in px; anything else (%, em) has no intrinsic ratio to read.
  const w = text.match(/\bwidth\s*=\s*["']\s*([\d.]+)(px)?\s*["']/);
  const h = text.match(/\bheight\s*=\s*["']\s*([\d.]+)(px)?\s*["']/);
  if (w && h) {
    const width = Number(w[1]);
    const height = Number(h[1]);
    if (width > 0 && height > 0) return { width, height };
  }
  return null;
}

export function readDimensions(
  contentType: string,
  bytes: ArrayBuffer,
): Dimensions | null {
  const u8 = new Uint8Array(bytes);
  try {
    switch (contentType) {
      case "image/png":
        return png(u8);
      case "image/jpeg":
        return jpeg(u8);
      case "image/webp":
        return webp(u8);
      case "image/svg+xml":
        // The header lives near the top; decoding the whole file to
        // find it would be wasteful for a large illustration.
        return svg(new TextDecoder().decode(u8.slice(0, 4096)));
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * A CSS-ready ratio like "4/5", reduced so the stored value stays
 * readable. Falls back to "4/5" — the shape most pieces on the wall
 * already are — when the file will not say.
 */
export function aspectFrom(dimensions: Dimensions | null): string {
  if (!dimensions) return "4/5";
  const w = Math.round(dimensions.width);
  const h = Math.round(dimensions.height);
  if (w <= 0 || h <= 0) return "4/5";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  // Keep the stored ratio short; an odd 1907/2543 helps nobody read it.
  if (rw <= 99 && rh <= 99) return `${rw}/${rh}`;
  return `${(w / h).toFixed(3)}/1`;
}
