import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getGalleryPieces } from "./loader";

/**
 * Every file-backed gallery piece must parse. A malformed frontmatter
 * (an unquoted colon in the alt text, say) would otherwise surface as
 * a 500 on the live wall, not here.
 */
describe("gallery content files", () => {
  it("all parse and point at images that exist", () => {
    const pieces = getGalleryPieces();
    expect(pieces.length).toBeGreaterThan(0);
    for (const piece of pieces) {
      expect(piece.title, piece.slug).not.toBe("");
      expect(piece.alt, piece.slug).not.toBe("");
      expect(piece.media.startsWith("/"), piece.slug).toBe(true);
      expect(
        fs.existsSync(path.join(process.cwd(), "public", piece.media)),
        `${piece.slug}: ${piece.media}`,
      ).toBe(true);
      expect(piece.aspect, piece.slug).toMatch(/^\d+\/\d+$/);
    }
  });
});
