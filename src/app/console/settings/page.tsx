import { redirect } from "next/navigation";

/** Settings has one section so far; go straight to it. */
export default function SettingsIndexPage() {
  redirect("/console/settings/gallery");
}
