import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://porscha.today"),
  title: {
    default: "POR$CHA — Founder, Artist, Builder",
    template: "%s · POR$CHA",
  },
  description:
    "POR$CHA — Founder, Artist, Builder. Art from the OBRA studio, apps by Chaos Origins, and the headquarters where both get built.",
  openGraph: {
    siteName: "POR$CHA",
    type: "website",
  },
};

export const viewport: Viewport = {
  // The night edition is the default, so the browser chrome matches the
  // ground rather than the reader's system preference.
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the stored theme before first paint. The magazine is printed
 * on black by default, so an unstamped document is already the night
 * edition — this only re-applies a reader's explicit choice, which
 * would otherwise flash the wrong stock on every load. Deliberately
 * tiny and dependency-free because it blocks rendering; a stored value
 * other than "light"/"dark" is ignored.
 */
const NO_FLASH_THEME = `(function(){try{var t=localStorage.getItem("porscha-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
