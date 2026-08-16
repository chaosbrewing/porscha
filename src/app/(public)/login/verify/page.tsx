import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkConsoleAccess } from "@/server/auth/guard";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "One more step",
  robots: { index: false, follow: false },
};

export default async function VerifyPage() {
  const access = await checkConsoleAccess();
  if (access.state === "authorized") redirect("/console/overview");
  if (access.state !== "two_factor_pending") redirect("/login");
  if (access.needsEnrollment) redirect("/login/setup-2fa");

  return (
    <div className="mx-auto max-w-md px-5 sm:px-8 py-20">
      <p className="type-meta text-accent-deep">Signed in as {access.user.githubLogin}</p>
      <h1 className="type-display text-4xl mt-3">One more step.</h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        Enter the code from your authenticator.
      </p>
      <TwoFactorVerify />
    </div>
  );
}
