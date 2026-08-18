import { redirect } from "next/navigation";

/** Settings opens on the gallery; photography is a tab away. */
export default function SettingsIndexPage() {
  redirect("/console/settings/gallery");
}
