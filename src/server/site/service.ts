import "server-only";
import { cache } from "react";
import {
  PAGE_KEYS,
  PAGE_SCHEMAS,
  SITE_DEFAULTS,
  type PageKey,
  type SiteContent,
} from "@/content/site";
import { readPageOverrides } from "./store";

/**
 * The public site's read model for copy, lists and images.
 *
 * Each page resolves to its console override when one exists and
 * validates, otherwise to the typed defaults. An override that fails
 * validation (a hand-edited row, a schema that moved on) is logged
 * and ignored rather than allowed to take the page down.
 */

type Row = Record<string, unknown>;

function isRow(value: unknown): value is Row {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * A door or window saved before it could carry a picture borrows the
 * default picture for the same destination. One the console added
 * itself stays bare until a picture is chosen. On the home page the
 * door to /me prefers the row's own "one image", which is what that
 * field used to mean.
 */
function borrowPictures(
  items: unknown,
  defaults: ReadonlyArray<{ href: string; image: unknown }>,
  fallbackForMe?: unknown,
): unknown {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!isRow(item) || item.image) return item;
    const own = item.href === "/me" && isRow(fallbackForMe) ? fallbackForMe : null;
    const byHref = defaults.find((d) => d.href === item.href)?.image ?? null;
    return { ...item, image: own ?? byHref };
  });
}

/** Per-page repairs for rows saved under an earlier shape. */
const UPGRADES: { [K in PageKey]?: (row: Row) => Row } = {
  home: (row) => ({
    ...row,
    paths: borrowPictures(row.paths, SITE_DEFAULTS.home.paths, row.visual),
  }),
  work: (row) => ({
    ...row,
    categories: borrowPictures(row.categories, SITE_DEFAULTS.work.categories),
  }),
};

export function resolvePage<K extends PageKey>(
  key: K,
  override: unknown,
): SiteContent[K] {
  if (override === undefined) return SITE_DEFAULTS[key];
  // Sections added to a page since its row was saved come from the
  // defaults, so the schema can grow without invalidating what the
  // console stored. Whole top-level sections are filled in; inside a
  // list, only the repairs above apply, and a stored value is never
  // overwritten.
  let merged: unknown = override;
  if (isRow(override)) {
    merged = { ...SITE_DEFAULTS[key], ...override };
    const upgrade = UPGRADES[key];
    if (upgrade) merged = upgrade(merged as Row);
  }
  const parsed = PAGE_SCHEMAS[key].safeParse(merged);
  if (!parsed.success) {
    console.error(`[site] stored content for "${key}" is invalid; using defaults`);
    return SITE_DEFAULTS[key];
  }
  return parsed.data as SiteContent[K];
}

/** Every page, resolved. Memoised per request. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const overrides = await readPageOverrides();
  const out = {} as SiteContent;
  for (const key of PAGE_KEYS) {
    (out as Record<PageKey, unknown>)[key] = resolvePage(key, overrides.get(key));
  }
  return out;
});

/** One page plus whether the console has overridden it. For the editor. */
export async function getPageForEditing<K extends PageKey>(
  key: K,
): Promise<{ value: SiteContent[K]; overridden: boolean }> {
  const overrides = await readPageOverrides();
  const override = overrides.get(key);
  return { value: resolvePage(key, override), overridden: override !== undefined };
}
