import "server-only";
import { cache } from "react";
import type { PhotoSlot, ResolvedPhoto } from "@/config/photography";
import { readPhotographySettings } from "./store";
import { resolveSlot } from "./resolve";
import type { PhotographySettings } from "./validation";

/**
 * The photography read model.
 *
 * Every editorial frame on the site goes through here: the console's
 * overrides laid over the registry defaults. `cache` keeps it to one
 * database read per request no matter how many frames a page holds —
 * the home page alone asks four times.
 */

export const getPhotographySettings = cache(
  async (): Promise<PhotographySettings> => readPhotographySettings(),
);

/**
 * What one slot shows right now. `fallback` supplies the default for
 * keys outside the registry — the per-project APPS frames.
 */
export async function getPhoto(
  key: string,
  fallback?: PhotoSlot,
): Promise<ResolvedPhoto> {
  const settings = await getPhotographySettings();
  return resolveSlot(settings, key, fallback);
}
