import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { requireConsoleAccess } from "@/server/auth/guard";
import { githubClient, GitHubApiError } from "@/server/github/client";

export const dynamic = "force-dynamic";

/**
 * Repository picker data: repositories visible to the server-side sync
 * token. Names and flags only — never tokens, never repo contents.
 */
export async function GET(req: NextRequest) {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  if (!env.githubSyncConfigured) {
    return NextResponse.json(
      {
        repos: [],
        unavailable: true,
        message:
          "GitHub isn't configured (no GITHUB_TOKEN) — you can still type owner/repo by hand.",
      },
      { status: 200 },
    );
  }

  const q = (new URL(req.url).searchParams.get("q") ?? "").toLowerCase();
  try {
    const repos = await githubClient.listAccessibleRepos();
    const filtered = repos
      .filter((r) => !q || r.full_name.toLowerCase().includes(q))
      .slice(0, 30)
      .map((r) => ({
        fullName: r.full_name,
        private: r.private,
        archived: r.archived,
      }));
    return NextResponse.json({ repos: filtered, unavailable: false });
  } catch (err) {
    const message =
      err instanceof GitHubApiError
        ? "GitHub didn't answer — check the token's access."
        : "GitHub is unreachable right now.";
    return NextResponse.json(
      { repos: [], unavailable: true, message },
      { status: 200 },
    );
  }
}
