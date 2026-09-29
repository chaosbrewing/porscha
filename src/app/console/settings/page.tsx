import { redirect } from "next/navigation";

/** Pages first: it is where most editing happens. */
export default function SettingsIndexPage() {
  redirect("/console/settings/pages");
}
