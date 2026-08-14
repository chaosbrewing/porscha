/** Human-friendly time formatting shared by public site and console. */

export function timeAgo(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const then = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(then.getTime())) return "—";
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 0) return "just now";
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? "yesterday" : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? "last week" : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "last month" : `${months} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "last year" : `${years} years ago`;
}

/** Coarse public activity signal — deliberately imprecise. */
export function coarseActivitySignal(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const days = (Date.now() - then.getTime()) / 86_400_000;
  if (days < 1) return "Activity today";
  if (days < 7) return "Activity this week";
  if (days < 31) return "Activity this month";
  if (days < 92) return "Activity this quarter";
  return "Resting for a while";
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
