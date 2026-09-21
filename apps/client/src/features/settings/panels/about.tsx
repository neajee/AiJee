import { useCallback, useEffect, useState } from "react";
import { Linking } from "@/platform/browser";
import { ArrowUpCircle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { api, unwrapApiData } from "@aijee/client-sdk";
import { SettingsRow, useSettingsPalette } from "@/components/settings-surface";
import { AboutGroup } from "./about-group";
import { ReleaseRow } from "./release-row";
import { getVersionInfo, formatReleaseTime, parseDescribeTag, type LatestRelease, type VersionInfo } from "../utils/about";
export function AboutRow({
  isLast
}: {
  isLast?: boolean;
}) {
  const [serverVersion, setServerVersion] = useState<string>('');
  useEffect(() => {
    getVersionInfo().then(data => {
      if (data?.version) setServerVersion(data.version);
    }).catch(() => {});
  }, []);
  return <SettingsRow icon={Info} label="关于" description={serverVersion ? `AiJee ${serverVersion}` : undefined} isLast={isLast} right={<span className="font-sans text-[var(--value-size)] text-text-tertiary">
          {serverVersion || '—'}
        </span>} />;
}

/** Full section, used on the wide stacked page and the detail screen. */
export function AboutPanel() {
  const p = useSettingsPalette();
  const [serverVersion, setServerVersion] = useState<string>('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [checkState, setCheckState] = useState<'idle' | 'checking' | 'checked' | 'error'>('idle');
  const [release, setRelease] = useState<LatestRelease | null>(null);
  useEffect(() => {
    getVersionInfo().then(data => {
      if (data?.version) setServerVersion(data.version);
      setVersionInfo(data ?? null);
    }).catch(() => {});
  }, []);
  const checkLatest = useCallback(async () => {
    setCheckState('checking');
    try {
      const result = await api.get({
        url: '/api/version/latest'
      });
      const data = unwrapApiData(result.data) as LatestRelease | undefined;
      setRelease(data ?? null);
      setCheckState(data?.latest ? 'checked' : 'error');
    } catch {
      setCheckState('error');
    }
  }, []);

  // Checking for updates is the default behavior on this screen.
  useEffect(() => {
    if (checkState === 'idle') void checkLatest();
  }, [checkState, checkLatest]);
  const openRelease = useCallback(() => {
    if (release?.release_url) Linking.openURL(release.release_url);
  }, [release?.release_url]);
  const parsed = parseDescribeTag(versionInfo?.tag);
  const versionLabel = parsed?.tag ?? versionInfo?.tag ?? (serverVersion ? `v${serverVersion}` : '—');
  const timeline = versionInfo?.timeline ?? [];
  // describe() can yield `v0.1.5-3-g134ff73-dirty` when HEAD sits past a tag;
  // match against the base tag so the 当前 pill lands on the right row.
  const currentReleaseTag = timeline.find(release => release.tag === versionLabel)?.tag ?? timeline[0]?.tag ?? null;
  const latestLabel = release?.latest ? release.latest.replace(/^v/i, '') : null;
  const heroBuildMeta = `构建于 ${formatReleaseTime(versionInfo?.updated_at)}`;
  const heroActionClass = "flex h-[34px] items-center gap-1.5 rounded-lg px-3 text-caption font-medium";
  return <div className="flex flex-col gap-[var(--group-gap)]">
      {/* 1 · Hero: version number + build meta + update check */}
      <AboutGroup title="当前版本">
        <div className="flex items-start justify-between gap-3 px-[var(--header-inset)]">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="font-mono text-display text-foreground">{versionLabel}</span>
            <span className="text-caption text-text-secondary">{heroBuildMeta}</span>
          </div>
          <div className="shrink-0">
            {checkState === 'checking' ? <div className="flex h-[34px] items-center gap-1.5 px-3">
                <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
                <span className="text-caption text-text-secondary">检查中…</span>
              </div> : checkState === 'error' ? <button onClick={() => void checkLatest()} role="button" aria-label="重新检查更新" className={`${heroActionClass} border border-border text-text-secondary hover:bg-hover`}>
                <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />
                <span>检查失败</span>
              </button> : release?.update_available && latestLabel ? <button onClick={openRelease} role="button" aria-label={`v${latestLabel} 可用，查看发布页`} className={`${heroActionClass} bg-accent text-accent-content hover:opacity-90`}>
                <ArrowUpCircle size={16} strokeWidth={1.8} />
                <span>v{latestLabel} 可用</span>
              </button> : <button onClick={() => void checkLatest()} role="button" aria-label="检查更新" className={`${heroActionClass} border border-border text-text-secondary hover:bg-hover`}>
                {checkState === 'checked' ? <CheckCircle2 size={14} color={p.success} strokeWidth={1.8} /> : <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />}
                <span>{checkState === 'checked' ? '已是最新' : '检查更新'}</span>
              </button>}
          </div>
        </div>
      </AboutGroup>

      {/* 2 · Changelog timeline */}
      <AboutGroup title="更新日志" divided>
        {timeline.length ? <div className="flex flex-col px-[var(--header-inset)]">
            {timeline.map(releaseEntry => <ReleaseRow key={releaseEntry.tag} release={releaseEntry} current={releaseEntry.tag === currentReleaseTag} />)}
          </div> : <div className="px-[var(--header-inset)] text-caption text-text-tertiary">
            当前构建未附带发布记录。
          </div>}
      </AboutGroup>
    </div>;
}
