import type { FsEntry } from '@aijee/client-sdk';

export function applyFilter(entries: FsEntry[], query: string, expandedDirs: Set<string>): FsEntry[] {
  if (!query) return entries;
  const needle = query.toLowerCase();
  return entries.filter((entry) => entry.name.toLowerCase().includes(needle) || (entry.is_dir && expandedDirs.has(entry.path)));
}

export function basename(path: string) {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed.slice(trimmed.lastIndexOf('/') + 1) || trimmed;
}

export function languageOf(path: string) {
  const name = basename(path);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}
