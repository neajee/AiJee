/**
 * Helpers for feeding tool-call diffs into a two-sided diff viewer.
 *
 * The viewer wants the whole old file and the whole new file, but the runtime
 * hands us a unified diff (or a list of old/new edit blocks). Both are turned
 * into a left/right pair here, so the components stay dumb.
 */

/** Rebuilds the two sides of a unified diff, dropping file/hunk headers. */
export function splitUnifiedDiff(diff: string): { oldValue: string; newValue: string } {
  const oldLines: string[] = [];
  const newLines: string[] = [];
  for (const raw of diff.split('\n')) {
    if (
      raw.startsWith('@@') ||
      raw.startsWith('diff ') ||
      raw.startsWith('index ') ||
      raw.startsWith('--- ') ||
      raw.startsWith('+++ ') ||
      raw.startsWith('\\')
    ) {
      continue;
    }
    if (raw.startsWith('+')) {
      newLines.push(raw.slice(1));
    } else if (raw.startsWith('-')) {
      oldLines.push(raw.slice(1));
    } else if (raw.startsWith(' ')) {
      oldLines.push(raw.slice(1));
      newLines.push(raw.slice(1));
    } else {
      oldLines.push(raw);
      newLines.push(raw);
    }
  }
  return { oldValue: oldLines.join('\n'), newValue: newLines.join('\n') };
}

/** Best-effort language guess from a file name, for Prism highlighting. */
export function detectLanguage(fileName: string, filePath: string): string | undefined {
  const lower = (fileName || filePath).toLowerCase();
  if (lower.endsWith('.tsx')) return 'tsx';
  if (lower.endsWith('.ts')) return 'ts';
  if (lower.endsWith('.jsx')) return 'jsx';
  if (lower.endsWith('.js')) return 'js';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.py')) return 'py';
  if (lower.endsWith('.sh')) return 'bash';
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.xml') || lower.endsWith('.svg')) return 'html';
  return undefined;
}
