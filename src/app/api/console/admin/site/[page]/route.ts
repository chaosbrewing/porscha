import { NextRequest, NextResponse } from "next/server";
import { PAGE_KEYS, PAGE_SCHEMAS, type PageKey } from "@/content/site/schema";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { firstValidationMessage } from "@/server/projects/validation";
import { resetPage, savePage } from "@/server/site/admin";
import { getPageForEditing } from "@/server/site/service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ page: string }> };

function pageKey(page: string): PageKey | null {
  return (PAGE_KEYS as string[]).includes(page) ? (page as PageKey) : null;
}

/** The page as the site currently resolves it, plus whether it is overridden. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;
  const key = pageKey((await params).page);
  if (!key) return NextResponse.json({ error: "No such page" }, { status: 404 });
  return NextResponse.json(await getPageForEditing(key));
}

/** Save the whole page. Validated against the page's schema first. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const key = pageKey((await params).page);
  if (!key) return NextResponse.json({ error: "No such page" }, { status: 404 });

  const parsed = PAGE_SCHEMAS[key].safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await savePage(user!.id, key, parsed.data as never);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[site] page save failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}

/** Drop the override; the page returns to its defaults. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const key = pageKey((await params).page);
  if (!key) return NextResponse.json({ error: "No such page" }, { status: 404 });

  try {
    await resetPage(user!.id, key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[site] page reset failed:", err);
    return NextResponse.json(
      { error: "Resetting didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
