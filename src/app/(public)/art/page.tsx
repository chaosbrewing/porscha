import type { Metadata } from "next";
import Link from "next/link";
import { ArtworkFrame } from "@/components/public/ArtworkFrame";
import { ButtonLink } from "@/components/public/ButtonLink";
import { Container } from "@/components/public/Container";
import { Doodle } from "@/components/public/Doodle";
import { PMark } from "@/components/public/PMark";
import { Eyebrow } from "@/components/public/Eyebrow";
import {
  categoryLabel,
  getPublicGalleryView,
  withUsedCategories,
  type ResolvedPiece,
} from "@/server/gallery/service";
import type { GalleryDisplaySettings } from "@/server/gallery/validation";

export const dynamic = "force-dynamic";

const INTRO = "My artwork and visual practice.";
const NOTE =
  "A space for exploration, expression and everything in between — paint, pixels, paper, a camera.";
const ASIDE = "Different mediums.\nSame thread.";

/**
 * The opening collage: five pieces in a loose arrangement beside the
 * introduction. Each frame crops to a fixed shape so the composition
 * holds whatever hangs there; the full wall below shows every piece
 * at its own proportions.
 */
const COLLAGE: Array<{ cell: string; aspect: string; sizes: string }> = [
  { cell: "col-span-3 row-span-2", aspect: "4/5", sizes: "(max-width: 1024px) 50vw, 360px" },
  { cell: "col-span-3", aspect: "3/2", sizes: "(max-width: 1024px) 50vw, 360px" },
  { cell: "col-span-3", aspect: "3/2", sizes: "(max-width: 1024px) 50vw, 360px" },
  { cell: "col-span-3", aspect: "1/1", sizes: "(max-width: 1024px) 50vw, 360px" },
  { cell: "col-span-3", aspect: "1/1", sizes: "(max-width: 1024px) 50vw, 360px" },
];

function Collage({ pieces }: { pieces: ResolvedPiece[] }) {
  return (
    <ul className="grid grid-cols-6 gap-3 sm:gap-4">
      {pieces.map((piece, i) => {
        const slot = COLLAGE[i];
        return (
          <li key={piece.slug} className={slot.cell}>
            <Link href={`/art/${piece.slug}`} className="group block h-full" aria-label={piece.title}>
              <ArtworkFrame
                src={piece.media}
                alt={piece.alt}
                aspect={slot.aspect}
                sizes={slot.sizes}
                priority={i < 2}
                className="h-full transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5 motion-reduce:transform-none"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

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

/**
 * Groups the wall by category, in the order the console lists them
 * (categories it has not seen yet follow, in order of appearance).
 * Sorting within a group is untouched.
 */
function groupByCategory(
  pieces: ResolvedPiece[],
  settings: GalleryDisplaySettings,
): Array<{ key: string; label: string; pieces: ResolvedPiece[] }> {
  const order = settings.categories.map((c) => c.key);
  const groups = new Map<string, ResolvedPiece[]>();
  for (const piece of pieces) {
    const list = groups.get(piece.category) ?? [];
    list.push(piece);
    groups.set(piece.category, list);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return keys.map((key) => ({
    key,
    label: categoryLabel(settings, key),
    pieces: groups.get(key)!,
  }));
}

function Wall({
  pieces,
  priorityFirst,
}: {
  pieces: ResolvedPiece[];
  priorityFirst: boolean;
}) {
  return (
    <ul className="grid grid-cols-1 gap-y-14 sm:grid-cols-12 sm:gap-x-8 sm:gap-y-20 lg:gap-y-28">
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
                priority={priorityFirst && index === 0}
                className="transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out-soft)] group-hover:-translate-y-0.5 motion-reduce:transform-none"
              />
              <span className="mt-3 flex items-baseline justify-between gap-4 text-sm">
                <span className="type-heading text-base text-ink transition-colors duration-[var(--duration-micro)] group-hover:text-accent-deep">
                  {piece.title}
                </span>
                <span className="flex shrink-0 items-baseline gap-3">
                  {piece.sold ? (
                    <span className="type-meta text-ink-faint">Sold</span>
                  ) : piece.forSale ? (
                    <span className="type-meta rounded-[2px] bg-accent-wash px-1.5 py-0.5 text-accent-deep">
                      For sale
                    </span>
                  ) : null}
                  <span className="type-meta text-ink-faint">{piece.year}</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default async function ArtPage() {
  const { settings: stored, pieces } = await getPublicGalleryView();
  // Categories the console has not named yet still get a readable label.
  const settings = withUsedCategories(stored, pieces);
  const groups = groupByCategory(pieces, settings);

  const collage = pieces.slice(0, COLLAGE.length);

  return (
    <Container className="pb-20 pt-8 sm:pt-12 lg:pb-32">
      <header className="grid gap-y-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
        <div className="reveal">
          <h1 className="type-display text-[clamp(2.5rem,6.5vw,4.5rem)]">Obra</h1>
          <p className="type-heading mt-5 max-w-[24rem] text-[1.25rem] sm:text-[1.5rem]">{INTRO}</p>
          <p className="mt-5 max-w-[26rem] text-[1.0625rem] leading-relaxed text-ink-soft">{NOTE}</p>
          {pieces.length > 0 ? (
            <p className="mt-8">
              <ButtonLink href="#wall">View gallery</ButtonLink>
            </p>
          ) : null}
          <p className="type-annotation mt-10 flex items-end gap-2 text-[1.125rem] sm:text-[1.25rem]">
            <span className="-rotate-3">{ASIDE}</span>
            <Doodle direction="down-right" className="-mb-1 shrink-0" />
          </p>
        </div>
        {collage.length > 0 ? (
          <div className="reveal" style={{ ["--reveal-step" as string]: 1 }}>
            <Collage pieces={collage} />
          </div>
        ) : null}
      </header>

      {groups.length === 1 ? (
        <div id="wall" className="mt-20 scroll-mt-8 lg:mt-28">
          <Wall pieces={groups[0].pieces} priorityFirst={false} />
        </div>
      ) : groups.length > 1 ? (
        <div id="wall" className="mt-20 scroll-mt-8 space-y-24 lg:mt-28 lg:space-y-36">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`wall-${group.key}`}>
              <div className="mb-10 flex items-baseline gap-4 border-t border-line pt-6 lg:mb-14">
                <h2 id={`wall-${group.key}`} className="type-heading text-2xl sm:text-3xl">
                  {group.label}
                </h2>
                <Eyebrow as="span">{group.pieces.length}</Eyebrow>
              </div>
              <Wall pieces={group.pieces} priorityFirst={false} />
            </section>
          ))}
        </div>
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
