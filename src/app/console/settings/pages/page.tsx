import type { Metadata } from "next";
import { PAGE_KEYS, type PageKey } from "@/content/site/schema";
import { getPageForEditing } from "@/server/site/service";
import { PageEditor } from "@/components/console/site-editor/PageEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const key: PageKey = (PAGE_KEYS as string[]).includes(page ?? "")
    ? (page as PageKey)
    : "home";
  const { value, overridden } = await getPageForEditing(key);
  return (
    <PageEditor
      key={key}
      page={key}
      initial={value as unknown as Record<string, unknown>}
      overridden={overridden}
    />
  );
}
