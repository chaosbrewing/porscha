import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { checkConsoleAccess } from "@/server/auth/guard";
import { getOrBeginEnrollment } from "@/server/auth/twofactor";
import { TwoFactorEnroll } from "@/components/auth/TwoFactorEnroll";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up two-factor",
  robots: { index: false, follow: false },
};

export default async function SetupTwoFactorPage() {
  const access = await checkConsoleAccess();
  if (access.state === "authorized") redirect("/console/overview");
  if (access.state !== "two_factor_pending") redirect("/login");
  if (!access.needsEnrollment) redirect("/login/verify");

  const enrollment = await getOrBeginEnrollment(
    access.user.id,
    access.user.githubLogin,
  );
  const qrDataUrl = await QRCode.toDataURL(enrollment.uri, {
    margin: 1,
    width: 220,
  });

  return (
    <div className="mx-auto max-w-md px-5 sm:px-8 py-20">
      <p className="type-meta text-accent-deep">
        Signed in as {access.user.githubLogin}
      </p>
      <h1 className="type-display text-4xl mt-3">
        Let&rsquo;s lock the door properly.
      </h1>
      <p className="mt-3 text-ink-soft leading-relaxed">
        The console needs a second factor. Set up any TOTP authenticator —
        it takes about a minute, once.
      </p>
      <TwoFactorEnroll qrDataUrl={qrDataUrl} manualKey={enrollment.secret} />
    </div>
  );
}
