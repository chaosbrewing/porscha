import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, getNotes } from "@/server/content/loader";
import { getPublicProject } from "@/server/projects/service";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return { title: "Not found" };
  return {
    title: note.title,
    description: note.excerpt,
    alternates: { canonical: `/notes/${note.slug}` },
    openGraph: { type: "article", publishedTime: note.date.toISOString() },
  };
}

export function generateStaticParams() {
  return getNotes().map((n) => ({ slug: n.slug }));
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  const related = note.project ? await getPublicProject(note.project) : null;

  return (
    <article className="mx-auto max-w-3xl px-5 sm:px-8">
      <header className="py-14 md:py-20 pb-8">
        <p className="mb-4">
          <Link
            href="/notes"
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            ← Notes
          </Link>
        </p>
        <p className="type-meta text-ink-faint">{formatDate(note.date)}</p>
        <h1 className="type-display text-4xl sm:text-5xl mt-3">{note.title}</h1>
      </header>

      <div
        className="prose-workshop pb-10"
        dangerouslySetInnerHTML={{ __html: note.html }}
      />

      {related ? (
        <footer className="border-t border-line py-8 text-sm">
          <span className="type-meta text-ink-faint mr-2">About the project</span>
          <Link
            href={`/workshop/${related.slug}`}
            className="underline underline-offset-4 decoration-line-strong hover:decoration-accent"
          >
            {related.name}
          </Link>
        </footer>
      ) : null}
    </article>
  );
}
