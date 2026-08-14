import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { getNotes } from "@/server/content/loader";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Short writing from the workshop — observations, devlogs, discoveries, and design thinking.",
  alternates: { canonical: "/notes" },
};

const KIND_LABEL: Record<string, string> = {
  observation: "Observation",
  devlog: "Devlog",
  discovery: "Discovery",
  design: "Design",
  essay: "Essay",
  reflection: "Reflection",
};

export default function NotesPage() {
  const notes = getNotes();

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8">
      <header className="py-14 md:py-20">
        <h1 className="type-display text-5xl sm:text-6xl">Notes</h1>
        <p className="mt-5 text-lg text-ink-soft leading-relaxed">
          Margin notes from the workshop. Some are two paragraphs, some grow
          into essays; none of them had to be a blog post.
        </p>
      </header>

      {notes.length > 0 ? (
        <ul className="border-t border-line-strong">
          {notes.map((note) => (
            <li key={note.slug} className="border-b border-line">
              <Link href={`/notes/${note.slug}`} className="group block py-7">
                <p className="type-meta text-ink-faint">
                  {KIND_LABEL[note.kind]} · {formatDate(note.date)}
                </p>
                <h2 className="type-heading text-2xl mt-1.5 group-hover:text-accent-deep transition-colors duration-[var(--duration-micro)]">
                  {note.title}
                </h2>
                <p className="mt-2 text-ink-soft leading-relaxed line-clamp-2">
                  {note.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing written down yet">
          Notes appear here as they&rsquo;re jotted.
        </EmptyState>
      )}
    </div>
  );
}
