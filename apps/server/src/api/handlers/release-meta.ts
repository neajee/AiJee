import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

type ReleaseNote = { type: "feature" | "fix" | "other"; title: string; scope: string | null; commit: string | null };

type ReleaseTag = { tag: string; published_at: string | null; commit: string | null; notes?: ReleaseNote[] };

type VersionMetadata = { tag: string; commit: string | null; updated_at: string | null; timeline: ReleaseTag[]; node: string };

/** `v0.1.5` vs `v0.1.6-alpha.1`: numeric compare on the core segments. */
function compareSemver(a: string, b: string): number {
  const clean = (value: string) => value.replace(/^v/i, "").split(/[-+]/)[0];
  const pa = clean(a).split(".").map(Number);
  const pb = clean(b).split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/** Check once per hour; disabled by AIJEE_UPDATE_CHECK=0|off|false. */
const UPDATE_CHECK_TTL = 60 * 60 * 1000;
const UPDATE_CHECK_ENABLED = !["0", "off", "false"].includes((process.env.AIJEE_UPDATE_CHECK ?? "1").toLowerCase());
let releaseCache: { at: number; data: LatestRelease } | null = null;

type LatestRelease = {
  current: string;
  latest: string | null;
  update_available: boolean;
  release_url: string | null;
  published_at: string | null;
  checked_at: number | null;
};

export async function latestReleaseCheck(): Promise<LatestRelease | null> {
  if (!UPDATE_CHECK_ENABLED) return null;
  if (releaseCache && Date.now() - releaseCache.at < UPDATE_CHECK_TTL) return releaseCache.data;
  const repo = process.env.AIJEE_GITHUB_REPO ?? "neajee/AiJee";
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: { "User-Agent": "AiJee", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const json = (await response.json()) as { tag_name?: string; html_url?: string; published_at?: string };
    const current = versionMetadata().tag;
    const latest = json.tag_name ?? null;
    const data: LatestRelease = {
      current,
      latest,
      update_available: !!latest && compareSemver(latest, current) > 0,
      release_url: json.html_url ?? null,
      published_at: json.published_at ?? null,
      checked_at: Date.now(),
    };
    releaseCache = { at: Date.now(), data };
    return data;
  } catch {
    return null;
  }
}

/** Conventional-commit classification (full-width `：` tolerated). */
function gitClassifySubject(subject: string): { type: ReleaseNote["type"]; title: string } {
  const trimmed = subject.trim();
  const match = trimmed.match(/^(\w+)(?:\(([^)]+)\))?(!)?[:：]\s*(.*)$/i);
  if (!match || !match[4]) return { type: "other", title: trimmed };
  const raw = match[1].toLowerCase();
  if (match[3] || raw === "feat" || raw === "feature") return { type: "feature", title: match[4].trim() };
  if (raw === "fix" || raw === "bugfix" || raw === "bug") return { type: "fix", title: match[4].trim() };
  return { type: "other", title: trimmed };
}

/** Commits between two tags (or full history for the oldest), as notes. */
function gitCommitsFor(root: string, tag: string, prev: string | null): ReleaseNote[] {
  const range = prev ? `${prev}..${tag}` : tag;
  const out = execFileSync("git", ["log", range, "--format=%h%x00%s", "--no-merges"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [commit, subject] = line.split("\x00");
      const { type, title } = gitClassifySubject(subject ?? "");
      return { type, title, scope: null as string | null, commit: commit || null };
    });
}

/**
 * Current release + release history.
 *
 * Priority: a build-time snapshot (`dist/releases.json`, written by
 * scripts/write-releases-snapshot.mjs and copied into the web root) → live
 * `git` in a source checkout → env-var / package fallback. The snapshot is
 * what packaged builds rely on, since no .git ships with them.
 */
export function versionMetadata(): VersionMetadata {
  const fallbackTag = `v${process.env.AIJEE_VERSION ?? "0.1.0"}`;
  // Same default the static file server uses for AIJEE_WEB_ROOT, so a snapshot
  // next to index.html is found wherever the web assets were unpacked.
  const webRoot = process.env.AIJEE_WEB_ROOT ?? fileURLToPath(new URL("../../public", import.meta.url));
  const snapshotPath = process.env.AIJEE_RELEASES_FILE ?? join(webRoot, "releases.json");
  try {
    if (existsSync(snapshotPath)) {
      const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
      return {
        tag: typeof snapshot.tag === "string" && snapshot.tag ? snapshot.tag : fallbackTag,
        commit: typeof snapshot.commit === "string" ? snapshot.commit : null,
        updated_at: typeof snapshot.updated_at === "string" ? snapshot.updated_at : null,
        timeline: Array.isArray(snapshot.timeline)
          ? snapshot.timeline.slice(0, 6).map((entry: any) => ({
              tag: String(entry?.tag ?? ""),
              published_at: entry?.published_at ?? null,
              commit: entry?.commit ?? null,
              notes: Array.isArray(entry?.notes) ? entry.notes : [],
            }))
          : [],
        node: process.version,
      };
    }
  } catch {
    // Fall through to git — a corrupt snapshot should not hide real data.
  }
  const root = resolve(fileURLToPath(new URL("../../../../", import.meta.url)));
  try {
    const run = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const entries = run("for-each-ref", "--sort=-creatordate", "--format=%(refname:short)|%(creatordate:iso-strict)|%(objectname:short)", "refs/tags")
      .split("\n")
      .filter(Boolean)
      .slice(0, 6)
      .map((line) => {
        const [tag, published_at, commit] = line.split("|");
        return { tag, published_at: published_at || null, commit: commit || null };
      });
    const withNotes = entries.map((entry, index) => ({
      ...entry,
      notes: gitCommitsFor(root, entry.tag, index < entries.length - 1 ? entries[index + 1].tag : null),
    }));
    return {
      tag: process.env.AIJEE_RELEASE_TAG ?? run("describe", "--tags", "--always", "--dirty"),
      commit: process.env.AIJEE_BUILD_COMMIT ?? run("rev-parse", "--short", "HEAD"),
      updated_at: process.env.AIJEE_BUILD_TIME ?? run("log", "-1", "--format=%cI"),
      timeline: withNotes,
      node: process.version,
    };
  } catch {
    return { tag: process.env.AIJEE_RELEASE_TAG ?? fallbackTag, commit: process.env.AIJEE_BUILD_COMMIT ?? null, updated_at: process.env.AIJEE_BUILD_TIME ?? null, timeline: [], node: process.version };
  }
}
