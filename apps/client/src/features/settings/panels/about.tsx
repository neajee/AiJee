import { toTailwind } from "@/styles/to-tailwind";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "@/platform/browser";
import { ArrowUpCircle, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { api, unwrapApiData } from "@aijee/client-sdk";
import { Fonts } from "@/constants/theme";
import { SettingsGroup, SettingsRow, useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { AboutGroup } from "./about-group";
import { ReleaseRow } from "./release-row";
import { getVersionInfo, formatReleaseTime, parseDescribeTag, type LatestRelease, type VersionInfo } from "../utils/about";
import { aboutStyles } from "../utils/about-styles";
export function AboutRow({
  isLast
}: {
  isLast?: boolean;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [serverVersion, setServerVersion] = useState<string>('');
  useEffect(() => {
    getVersionInfo().then(data => {
      if (data?.version) setServerVersion(data.version);
    }).catch(() => {});
  }, []);
  return <SettingsRow icon={Info} label="关于" description={serverVersion ? `AiJee ${serverVersion}` : undefined} isLast={isLast} right={<span className={toTailwind({
    fontSize: m.valueSize,
    fontFamily: Fonts.sans,
    color: p.textTertiary
  })}>
          {serverVersion || '—'}
        </span>} />;
}

/** Full section, used on the wide stacked page and the detail screen. */
export function AboutPanel() {
  const m = useSettingsMetrics();
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
    if (release?.release_url) Linking.openURL(release.release_url).catch(() => {});
  }, [release?.release_url]);
  const parsed = parseDescribeTag(versionInfo?.tag);
  const versionLabel = parsed?.tag ?? versionInfo?.tag ?? (serverVersion ? `v${serverVersion}` : '—');
  const suffixParts: string[] = [];
  if (parsed?.ahead) suffixParts.push(`+${parsed.ahead} 提交`);
  if (parsed?.dirty) suffixParts.push('工作区已修改');
  const versionSuffix = suffixParts.length ? suffixParts.join(' · ') : null;
  const timeline = versionInfo?.timeline ?? [];
  // describe() can yield `v0.1.5-3-g134ff73-dirty` when HEAD sits past a tag;
  // match against the base tag so the 当前 pill lands on the right row.
  const currentReleaseTag = timeline.find(release => release.tag === versionLabel)?.tag ?? timeline[0]?.tag ?? null;
  const latestLabel = release?.latest ? release.latest.replace(/^v/i, '') : null;
  const heroBuildMeta = `构建于 ${formatReleaseTime(versionInfo?.updated_at)}${versionSuffix ? ` · ${versionSuffix}` : ''}`;
  return <div className={toTailwind({
    gap: m.groupGap
  })}>
      {/* 1 · Hero: version number + build meta + update check */}
      <AboutGroup title="当前版本">
        <div className={toTailwind(aboutStyles.hero)}>
          <div className={toTailwind(aboutStyles.heroMain)}>
            <span className={toTailwind([aboutStyles.heroVersion, {
            color: p.text
          }])}>{versionLabel}</span>
            <span className={toTailwind([aboutStyles.heroMeta, {
            color: p.textTertiary
          }])}>
              {heroBuildMeta}
            </span>
          </div>
          <div className={toTailwind(aboutStyles.heroAction)}>
            {checkState === 'checking' ? <div className={toTailwind([aboutStyles.heroBtn, {
            borderColor: p.separator
          }])}>
                <span size="small" color={p.textTertiary} />
                <span className={toTailwind([aboutStyles.heroBtnText, {
              color: p.textTertiary
            }])}>检查中…</span>
              </div> : checkState === 'error' ? <button onClick={() => void checkLatest()} role="button" aria-label="重新检查更新">
                <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />
                <span className={toTailwind([aboutStyles.heroBtnText, {
              color: p.textSecondary
            }])}>检查失败</span>
              </button> : release?.update_available && latestLabel ? <button onClick={openRelease} role="button" aria-label={`v${latestLabel} 可用，查看发布页`}>
                <ArrowUpCircle size={16} color={p.onAccent} strokeWidth={1.8} />
                <span className={toTailwind([aboutStyles.heroBtnTextAccent, {
              color: p.onAccent
            }])}>v{latestLabel} 可用</span>
              </button> : <button onClick={() => void checkLatest()} role="button" aria-label="检查更新">
                {checkState === 'checked' ? <CheckCircle2 size={14} color={p.success} strokeWidth={1.8} /> : <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />}
                <span className={toTailwind([aboutStyles.heroBtnText, {
              color: checkState === 'checked' ? p.success : p.textSecondary
            }])}>
                  {checkState === 'checked' ? '已是最新' : '检查更新'}
                </span>
              </button>}
          </div>
        </div>
      </AboutGroup>

      {/* 2 · Changelog timeline */}
      <AboutGroup title={`更新日志 (${timeline.length})`}>
        {timeline.length ? <div className={toTailwind(aboutStyles.timelineBlock)}>
            <div className={toTailwind([aboutStyles.timelineRail, {
          backgroundColor: p.border
        }])} />
            {timeline.map((releaseEntry, index) => <ReleaseRow key={releaseEntry.tag} release={releaseEntry} current={releaseEntry.tag === currentReleaseTag} defaultOpen={index === 0} />)}
          </div> : <div className={toTailwind(aboutStyles.timelineEmpty)}>
            <span className={toTailwind([aboutStyles.timelineTime, {
          color: p.textTertiary
        }])}>当前构建未附带发布记录。</span>
          </div>}
      </AboutGroup>

    </div>;
}
