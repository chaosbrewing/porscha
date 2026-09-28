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

export function resolvePage<K extends PageKey>(
  key: K,
  override: unknown,
): SiteContent[K] {
  if (override === undefined) return SITE_DEFAULTS[key];
  const parsed = PAGE_SCHEMAS[key].safeParse(override);
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
