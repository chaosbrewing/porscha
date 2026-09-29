import { buildingDefaults, experimentsDefaults, workDefaults } from "./work";
import { globalDefaults, site } from "./global";
import { homeDefaults } from "./home";
import { meDefaults } from "./me";
import { nowDefaults } from "./now";
import type { SiteContent } from "./schema";

export * from "./schema";
export { site };

/**
 * What every page shows until the console says otherwise. The console
 * stores an override per page; `getSiteContent()` on the server merges
 * the two. Editing these files changes the starting point, not the
 * live site, once an override exists.
 */
export const SITE_DEFAULTS: SiteContent = {
  global: globalDefaults,
  home: homeDefaults,
  work: workDefaults,
  experiments: experimentsDefaults,
  building: buildingDefaults,
  now: nowDefaults,
  me: meDefaults,
};
