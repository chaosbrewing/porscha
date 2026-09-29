import { NextRequest } from "next/server";
import { handleImageUpload } from "@/server/media/upload";

export const dynamic = "force-dynamic";

/** Upload an image for a page (home visual, Making, ending, fragments). */
export async function POST(req: NextRequest) {
  return handleImageUpload(req, "site");
}
