import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkFrame } from "@/components/public/ArtworkFrame";
import { Container } from "@/components/public/Container";
import { PageIntro } from "@/components/public/PageIntro";
import { PMark } from "@/components/public/PMark";
import { getPublicGalleryView } from "@/server/gallery/service";

export const dynamic = "force-dynamic";

const INTRO = "My artwork and visual practice.";
const NOTE =
  "A space for exploration and expression, across whatever medium the idea needs — paint, pixels, paper, a camera.";

export const metadata: Metadata = {
  title: "Obra",
  description: `Obra — ${INTRO} ${NOTE}`,
  alternates: { canonical: "/art" },
};

/**
 * Irregular editorial composition on a 12-column grid: the pattern
 * repeats every six pieces so the wall never reads as a catalogue.
 * Small screens stack with alternating indents; tablets use two
 * columns.
 */
const PLACEMENT = [
  "sm:col-span-7 lg:col-span-7",
  "sm:col-span-5 lg:col-span-4 lg:col-start-9 lg:mt-24",
  "sm:col-span-6 lg:col-span-5 lg:col-start-2",
  "sm:col-span-6 lg:col-span-6 lg:col-start-7 lg:mt-16",
  "sm:col-span-8 lg:col-span-7 lg:col-start-3",
  "sm:col-span-4 lg:col-span-4 lg:col-start-1 lg:-mt-10",
];

const SIZES = [
  "(max-width: 640px) 92vw, (max-width: 1024px) 58vw, 640px",
  "(max-width: 640px) 80vw, (max-width: 1024px) 42vw, 380px",
  "(max-width: 640px) 92vw, (max-width: 1024px) 50vw, 460px",
  "(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 560px",
  "(max-width: 640px) 92vw, (max-width: 1024px) 66vw, 640px",
  "(max-width: 640px) 80vw, (max-width: 1024px) 34vw, 380px",
];

export default async function ArtPage() {
  const { pieces } = await getPublicGalleryView();

  return (
    <Container className="pb-20 pt-10 sm:pt-16 lg:pb-32">
      <PageIntro heading="Obra" intro={INTRO}>
        <p className="mt-4 max-w-[34rem] leading-relaxed text-ink-faint">
          {NOTE}
        </p>
      </PageIntro>

      {pieces.length > 0 ? (
        <ul className="mt-16 grid grid-cols-1 gap-y-14 sm:grid-cols-12 sm:gap-x-8 sm:gap-y-20 lg:mt-28 lg:gap-y-28">
          {pieces.map((piece, index) => {
            const slot = index % PLACEMENT.length;
            const indent = index % 2 === 1 ? "ml-[8%] sm:ml-0" : "mr-[8%] sm:mr-0";
            return (
              <li
                key={piece.slug}
                className={`reveal-view ${indent} ${PLACEMENT[slot]}`}
              >
                <Link href={`/art/${piece.slug}`} className="group block">
                  <ArtworkFrame
                    src={piece.media}
                    alt={piece.alt}
                    aspect={piece.aspect}
                    sizes={SIZES[slot]}
                    priority={index === 0}
                    className="transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5 motion-reduce:transform-none"
                  />
                  <span className="mt-3 flex items-baseline justify-between gap-4 text-sm">
                    <span className="type-heading text-base text-ink transition-colors duration-[var(--duration-micro)] group-hover:text-accent-deep">
                      {piece.title}
                    </span>
                    <span className="type-meta shrink-0 text-ink-faint">
                      {piece.year}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-16 max-w-[34rem] border-t border-line pt-10 lg:mt-24">
          <p className="type-heading text-2xl">The walls are bare for now.</p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Work gets hung as it&rsquo;s finished. Come back soon.
          </p>
        </div>
      )}

      <p className="mt-20 flex justify-end lg:mt-28">
        <PMark className="text-2xl text-ink-faint" />
      </p>
    </Container>
  );
}
