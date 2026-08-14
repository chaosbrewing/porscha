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
  themeColor: "#f5f0e6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
