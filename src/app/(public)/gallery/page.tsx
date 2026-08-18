import { permanentRedirect } from "next/navigation";

/**
 * The gallery index moved to `/art` when the site became POR$CHA.
 *
 * A redirect rather than a second live index: one URL for the wall,
 * and every link ever published to `/gallery` still lands on it.
 * Individual piece URLs are *not* redirected — see `[piece]/page.tsx`.
 */
export default function GalleryIndexPage() {
  permanentRedirect("/art");
}
