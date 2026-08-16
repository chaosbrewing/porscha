import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";

/** Same-origin check for state-changing POST endpoints. */
export function badOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(env.SITE_URL).origin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  return null;
}

export async function readJson<T>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
