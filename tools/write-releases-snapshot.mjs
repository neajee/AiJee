/**
 * Writes dist/releases.json — a build-time snapshot of release tags plus a
 * changelog per release.
 *
 * Sources, in priority order:
 *   1. CHANGELOG.md at the repo root, parsed per `## <version>` block
 *      (hand-written descriptions win over commit subjects).
 *   2. git log between consecutive tags, classified by conventional-commit
 *      type; the oldest tag reads the full history before it.
 *
 * The runtime reads this file instead of shelling out to `git`, so packaged
 * builds (desktop, npm) get a version timeline + changelog even though no
 * .git directory ships with them. `dist/` is copied verbatim into
 * apps/server/public by prepare-web-assets.cjs, so the snapshot travels with
 * the web assets.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, "dist", "releases.json");
const fallbackTag = `v${process.env.AIJEE_VERSION ?? "0.1.0"}`;
const MAX_TAGS = 6;

function run(...args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

// ─── Changelog classification ─────────────────────────────────

const CHANGELOG_TYPES = new Map([
  ["added", "feature"],
  ["fixed", "fix"],
  ["breaking", "feature"],
  ["changed", "other"],
  ["removed", "other"],
]);

/** `feat(scope)!: subject` / `fix：主题`; full-width `：` tolerated. */
function classifySubject(subject) {
  const trimmed = subject.trim();
  const match = trimmed.match(/^(\w+)(?:\(([^)]+)\))?(!)?[:：]\s*(.*)$/i);
  if (!match || !match[4]) return { type: "other", title: trimmed, scope: null };
  const [, raw, scope, bang, title] = match;
  const type = raw.toLowerCase();
  if (bang || type === "feat" || type === "feature") return { type: "feature", title: title.trim(), scope: scope || null };
  if (type === "fix" || type === "bugfix" || type === "bug") return { type: "fix", title: title.trim(), scope: scope || null };
  return { type: "other", title: trimmed, scope: null };
}

/** Parse CHANGELOG.md into a Map<version-without-v, notes[]>. */
function parseChangelogFile() {
  const path = resolve(root, "CHANGELOG.md");
  if (!existsSync(path)) return null;
  let text;
  try { text = readFileSync(path, "utf8"); } catch { return null; }
  const byVersion = new Map();
  let current = null;
  let currentType = "other";
  for (const line of text.split(/\r?\n/)) {
    const h2 = line.match(/^##\s+(?:\[)?v?([0-9]+\.[0-9]+\.[0-9]+)(?:\])?/i);
    if (h2) {
      current = h2[1];
      currentType = "other";
      byVersion.set(current, []);
      continue;
    }
    if (!current) continue;
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      currentType = CHANGELOG_TYPES.get(h3[1].trim().toLowerCase()) ?? "other";
      continue;
    }
    const item = line.match(/^\s*[-*]\s+(.+)/);
    if (item && item[1].trim()) {
      byVersion.get(current)?.push({ type: currentType, title: item[1].trim(), scope: null, commit: null });
    }
  }
  return byVersion;
}

function commitsFor(tag, prev) {
  const range = prev ? `${prev}..${tag}` : tag;
  const out = run("log", range, "--format=%h%x00%s", "--no-merges");
  if (!out) return [];
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [commit, subject] = line.split("\x00");
      return { ...classifySubject(subject ?? ""), commit: commit || null };
    });
}

// ─── Snapshot ─────────────────────────────────────────────────

const changelog = parseChangelogFile();

const refs = run("for-each-ref", "--sort=-creatordate", "--format=%(refname:short)|%(creatordate:iso-strict)|%(objectname:short)", "refs/tags");
const tags = refs
  ? refs
      .split("\n")
      .filter(Boolean)
      .slice(0, MAX_TAGS)
      .map((line) => {
        const [tag, published_at, commit] = line.split("|");
        return { tag, published_at: published_at || null, commit: commit || null };
      })
  : [];

const timeline = tags.map((release, index) => {
  const base = release.tag.replace(/^v/i, "");
  const handWritten = changelog ? changelog.get(base) ?? changelog.get(release.tag) : null;
  const notes = handWritten && handWritten.some((note) => note.title)
    ? handWritten
    : commitsFor(release.tag, index < tags.length - 1 ? tags[index + 1].tag : null);
  return { ...release, notes };
});

const snapshot = {
  tag: process.env.AIJEE_RELEASE_TAG ?? run("describe", "--tags", "--always", "--dirty") ?? fallbackTag,
  commit: process.env.AIJEE_BUILD_COMMIT ?? run("rev-parse", "--short", "HEAD"),
  updated_at: process.env.AIJEE_BUILD_TIME ?? run("log", "-1", "--format=%cI"),
  timeline,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${outFile} (${timeline.length} release tags)`);