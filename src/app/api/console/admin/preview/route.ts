import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { toPublicProjectView } from "@/server/projects/transformers";
import { computeAllMilestones } from "@/server/projects/progress";
import {
  firstValidationMessage,
  projectAdminInputSchema,
} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

/**
 * "What visitors will see": runs draft configuration through the REAL
 * public serializer — the same allowlist transformer the public site
 * uses — with no database writes.
 */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const body = await readJson<unknown>(req);
  const parsed = projectAdminInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (!input.isPublic) {
    return NextResponse.json({ hidden: true });
  }

  const milestones = computeAllMilestones(
    input.milestones.map((m) => ({
      slug: m.slug,
      title: m.title,
      publicSummary: m.publicSummary,
      workItems: m.workItems.map((w) => ({ done: w.done })),
    })),
    input.currentMilestone,
  );

  const view = toPublicProjectView(
    {
      slug: input.slug,
      name: input.name,
      description: input.description,
      type: input.type,
      status: input.status,
      featured: input.featured,
      isApp: input.isApp,
      isPublic: input.isPublic,
      visibility: input.visibility,
      links: null,
      currentMilestone: input.currentMilestone,
      repoFullName: input.github?.repository ?? null,
      publicRepository: input.github?.publicRepository ?? false,
      lastSyncError: null,
    },
    // No snapshot: previews show configuration-derived signals only.
    null,
    milestones,
  );
  return NextResponse.json({ hidden: false, view });
}
