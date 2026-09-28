import type { ReactNode } from "react";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteFooter } from "@/components/public/SiteFooter";
import { site } from "@/content/site";
import { getSiteContent } from "@/server/site/service";

/**
 * Copy, links and images come from the console (with typed defaults),
 * so every public page renders on request rather than at build time.
 */
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { global } = await getSiteContent();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader name={site.name} nav={global.navigation} />
      <main id="main" className="flex-1 flex flex-col">
        {children}
      </main>
      <SiteFooter name={site.name} nav={global.navigation} social={global.social} />
    </>
  );
}
