import Image from "next/image";
import seal from "../../../public/brand/seal.png";

/**
 * The seal — a quiet signature. A wax-seal "P." that scales with the
 * surrounding text size (one em square), so callers size it with the
 * same text-* classes they always did.
 *
 * Decorative by default (hidden from assistive tech); pass `label` to
 * make it a meaningful mark, e.g. as a link's only content.
 */
export function PMark({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Image
      src={seal}
      alt={label ?? ""}
      aria-hidden={label ? undefined : "true"}
      width={64}
      height={64}
      sizes="64px"
      className={`inline-block h-[1.5em] w-[1.5em] select-none align-[-0.4em] ${className}`}
    />
  );
}
