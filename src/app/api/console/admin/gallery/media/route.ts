import { NextRequest } from "next/server";
import { handleImageUpload } from "@/server/media/upload";

export const dynamic = "force-dynamic";

/** Upload a gallery image; returns the public path to store on the piece. */
export async function POST(req: NextRequest) {
  return handleImageUpload(req, "gallery");
}
