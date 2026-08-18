import Image from "next/image";

/**
 * The OBRA mark.
 *
 * Gold leaf photographed on black, so it carries its own ground rather
 * than being knocked out — it needs the dark plate to read as metal.
 * On the night edition the plate disappears into the page; on the day
 * edition it reads as a deliberate black stamp.
 */
export function ObraMark({
  className = "",
  /** Decorative by default — the page heading carries the name. */
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span className="inline-flex items-center justify-center bg-[#0d0b09] p-3">
      <Image
        src="/brand/obra-mark.jpg"
        alt={alt}
        width={220}
        height={220}
        className={`h-auto ${className}`}
      />
    </span>
  );
}
