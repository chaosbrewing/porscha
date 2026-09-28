/**
 * Metadata stripping for uploaded images.
 *
 * A photo straight from a phone carries EXIF (including GPS
 * coordinates), XMP and IPTC blocks. Nothing on this site needs them,
 * and publishing where a picture was taken is exactly the kind of
 * leak the privacy rules forbid. Each container is handled at the
 * byte level so the pixels are never re-encoded:
 *
 *   JPEG  drops APP1 (EXIF / XMP), APP13 (IPTC / Photoshop) and COM
 *         segments; keeps APP0 (JFIF), APP2 (ICC colour) and APP14
 *         (Adobe), which affect how the image renders.
 *   PNG   drops eXIf, tEXt, zTXt, iTXt and tIME chunks; keeps iCCP.
 *   WebP  drops the EXIF and XMP chunks and clears their flags in the
 *         VP8X header; keeps ICCP.
 *   SVG   passed through unchanged (text; no binary metadata block).
 *
 * Unknown or malformed input is returned as-is rather than rejected —
 * the dimension reader downstream decides whether the file is usable.
 */

const JPEG_DROP = new Set([0xe1, 0xed, 0xfe]);

function stripJpeg(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const out: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) break;
    const marker = bytes[i + 1];
    // Start of scan: everything from here is entropy-coded data.
    if (marker === 0xda) {
      out.push(bytes.subarray(i));
      i = bytes.length;
      break;
    }
    // Stand-alone markers carry no length.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      out.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    const end = i + 2 + len;
    if (len < 2 || end > bytes.length) break;
    if (!JPEG_DROP.has(marker)) out.push(bytes.subarray(i, end));
    i = end;
  }
  if (i < bytes.length) out.push(bytes.subarray(i));
  return concat(out);
}

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_DROP = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

function stripPng(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 8 || !PNG_SIG.every((b, i) => bytes[i] === b)) return bytes;
  const out: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const len =
      ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
    const end = i + 12 + len;
    if (end > bytes.length) break;
    if (!PNG_DROP.has(type)) out.push(bytes.subarray(i, end));
    i = end;
    if (type === "IEND") break;
  }
  if (i < bytes.length) out.push(bytes.subarray(i));
  return concat(out);
}

const WEBP_DROP = new Set(["EXIF", "XMP "]);

function stripWebp(bytes: Uint8Array): Uint8Array {
  if (
    bytes.length < 12 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 12) !== "WEBP"
  ) {
    return bytes;
  }
  const chunks: Uint8Array[] = [];
  let i = 12;
  let vp8x: Uint8Array | null = null;
  while (i + 8 <= bytes.length) {
    const type = ascii(bytes, i, i + 4);
    const len =
      (bytes[i + 4] | (bytes[i + 5] << 8) | (bytes[i + 6] << 16) | (bytes[i + 7] << 24)) >>> 0;
    const padded = len + (len & 1);
    const end = i + 8 + padded;
    if (end > bytes.length) break;
    const chunk = bytes.slice(i, end);
    if (type === "VP8X") vp8x = chunk;
    if (!WEBP_DROP.has(type)) chunks.push(chunk);
    i = end;
  }
  if (vp8x && vp8x.length >= 9) {
    // Flags byte: ...X (XMP, bit 2) E (EXIF, bit 3). Clear both.
    vp8x[8] &= ~0x0c;
  }
  const body = concat(chunks);
  const header = new Uint8Array(12);
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  const riffLen = 4 + body.length;
  header[4] = riffLen & 0xff;
  header[5] = (riffLen >>> 8) & 0xff;
  header[6] = (riffLen >>> 16) & 0xff;
  header[7] = (riffLen >>> 24) & 0xff;
  header.set([0x57, 0x45, 0x42, 0x50], 8);
  return concat([header, body]);
}

function ascii(bytes: Uint8Array, from: number, to: number): string {
  let s = "";
  for (let i = from; i < to; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Returns a copy of the image with embedded metadata removed. */
export function stripImageMetadata(
  contentType: string,
  bytes: ArrayBuffer,
): ArrayBuffer {
  const view = new Uint8Array(bytes);
  let out: Uint8Array;
  switch (contentType) {
    case "image/jpeg":
      out = stripJpeg(view);
      break;
    case "image/png":
      out = stripPng(view);
      break;
    case "image/webp":
      out = stripWebp(view);
      break;
    default:
      return bytes;
  }
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
}
