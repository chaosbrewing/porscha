import Image from "next/image";

/**
 * A single work on the wall. The aspect ratio comes from the piece, so
 * the frame holds its shape before the image arrives and the image is
 * never stretched.
 */
export function ArtworkFrame({
  src,
  alt,
  aspect,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  aspect: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[3px] bg-paper-sunken ${className}`}
      style={{ aspectRatio: aspect.replace("/", " / ") }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
