import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "https://porscha.today"),
  title: {
    default: "Porscha is the process",
    template: "%s · porscha.today",
  },
  description:
    "Software. Experiments. Art. Porscha's headquarters on the internet — where she builds, breaks, and refines what matters, publicly.",
  openGraph: {
    siteName: "porscha.today",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#191612" },
  ],
  width: "device-width",
  initialScale: 1,
};

/**
 * Applies the stored theme before first paint. Without this the page
 * renders light and then corrects — a visible flash on every load for
 * anyone who chose dark. Deliberately tiny and dependency-free because
 * it blocks rendering; a stored value other than "light"/"dark" is
 * ignored, leaving the system preference to decide.
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
