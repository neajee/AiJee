export type Tab = "changes" | "files" | "history";

/**
 * Colour is spent only where it carries a warning.
 *
 * Nearly every row in a working tree is modified, so a yellow M on all of them
 * is noise that also drowns out the rare deletion. Modified, renamed, copied and
 * untracked stay neutral and lean on the letter; added and deleted keep their
 * colour because they are the two that change what exists.
 */
export const STATUS_COLORS: Record<string, string> = {
  A: "#26A269",
  D: "#E5484D",
};

export function statusLabel(s: string): string {
  return s.charAt(0).toUpperCase();
}

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
