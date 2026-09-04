import { client, unwrapApiData } from "@aijee/client-sdk";
export type ReleaseNote = { type: 'feature' | 'fix' | 'other'; title: string; scope?: string | null; commit?: string | null };

export type VersionInfo = {
  version?: string;
  tag?: string;
  commit?: string | null;
  updated_at?: string | null;
  timeline?: Array<{ tag: string; published_at: string | null; commit: string | null; notes?: ReleaseNote[] }>;
  node?: string;
  remote?: boolean;
  server_id?: string;
};

export type LatestRelease = {
  current?: string | null;
  latest?: string | null;
  update_available?: boolean;
  release_url?: string | null;
  published_at?: string | null;
  checked_at?: number | null;
};

export function formatReleaseTime(value: string | null | undefined): string {
  if (!value) return '时间未知';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Compact release timestamp: `08-30 11:23`, year shown only when it differs. */
export function formatReleaseShort(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const datePart = sameYear
    ? `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${datePart} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `v0.1.5-3-g134ff73-dirty` → base tag, commits ahead, dirty flag. */
export function parseDescribeTag(value: string | null | undefined): { tag: string; ahead: number; dirty: boolean } | null {
  if (!value) return null;
  const match = value.match(/^(v[^-]+)(?:-(\d+)-g[0-9a-f]+)?(?:-dirty)?$/i);
  if (!match) return null;
  return { tag: match[1], ahead: match[2] ? Number(match[2]) : 0, dirty: /-dirty$/.test(value) };
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const result = await client.get({ url: "/api/version" });
  return unwrapApiData(result.data) as VersionInfo;
}
