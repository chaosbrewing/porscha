import { permanentRedirect } from "next/navigation";

/**
 * Apps and Workshop share one project model; the project's canonical
 * home is its workshop page. Redirect instead of duplicating content.
 */
export default async function AppProjectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  permanentRedirect(`/workshop/${project}`);
}
