import Image from "next/image";
import {
  aspectRatio,
  resolvePhoto,
  type PhotoSlotKey,
} from "@/config/photography";

/**
 * One photography slot on the page.
 *
 * The layout asks for a slot key, never a file. Whether a real
 * photograph exists is decided in `src/config/photography.ts`; either
 * way this reserves the same box at the same aspect ratio, so dropping
 * the real frame in never moves the type around it.
 */
export function EditorialPhoto({
  slot,
  className = "",
  sizes = "100vw",
  preload = false,
  mono = false,
  caption,
  /** Overrides the registry aspect — for a deliberate crop in one spread. */
  aspect,
  /**
   * Fills the parent's height instead of holding the declared aspect —
   * used for the cover, where the photograph runs the full height of
   * the spread and bleeds off the page edge.
   */
  fillParent = false,
}: {
  slot: PhotoSlotKey;
  className?: string;
  sizes?: string;
  preload?: boolean;
  mono?: boolean;
  /** `false` prints no caption; a string overrides the registry's. */
  caption?: string | false;
  aspect?: string;
  fillParent?: boolean;
}) {
  const photo = resolvePhoto(slot);
  const ratio = aspectRatio(aspect ?? photo.aspect);
  const printed = caption === false ? null : (caption ?? photo.caption ?? null);
  // A filled parent has no ratio of its own; everywhere else the box is
  // reserved at the declared ratio whether or not the photograph exists.
  const box = fillParent
    ? { className: "h-full min-h-[24rem]", style: undefined }
    : { className: "", style: { aspectRatio: ratio } };

  return (
    <figure className={className}>
      {photo.held ? (
        <div
          className={`photo-plate flex items-end ${box.className}`}
          style={box.style}
        >
          <div className="w-full bg-paper/85 px-4 py-3 sm:px-5 sm:py-4">
            <p className="type-kicker text-accent">Photography slot</p>
            <p className="type-caption mt-1.5 max-w-sm">{photo.brief}</p>
          </div>
        </div>
      ) : (
        <div
          className={`photo ${mono ? "photo-mono" : ""} ${box.className}`}
          style={box.style}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={sizes}
            preload={preload}
            style={{ objectPosition: photo.focal ?? "50% 50%" }}
          />
        </div>
      )}

      {printed ? (
        <figcaption className="type-caption mt-3 flex items-center gap-3">
          <span aria-hidden="true" className="rule-copper w-6 shrink-0" />
          {printed}
        </figcaption>
      ) : null}
    </figure>
  );
}
