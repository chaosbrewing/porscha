import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SettingsNav } from "@/components/console/SettingsNav";

export const metadata: Metadata = {
  title: { default: "Settings", template: "%s · Settings" },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="type-display text-4xl sm:text-5xl">Settings</h1>
      <p className="mt-3 text-ink-soft">
        How the public rooms of the workshop present themselves.
      </p>
      <SettingsNav />
      <div className="mt-8">{children}</div>
    </div>
  );
}
