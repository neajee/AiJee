import { Spinner, Text, View } from 'tamagui';
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable } from 'react-native';
import { ArrowUpCircle, CheckCircle2, Info, RefreshCw } from "lucide-react-native";
import { client, unwrapApiData } from "@aijee/client-sdk";
import { Fonts } from "@/constants/theme";
import { SettingsGroup, SettingsRow, useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { AboutGroup } from "./about-group";
import { ReleaseRow } from "./release-row";
import { getVersionInfo, formatReleaseTime, parseDescribeTag, type LatestRelease, type VersionInfo } from "../utils/about";
import { aboutStyles } from "../utils/about-styles";
export function AboutRow({ isLast }: { isLast?: boolean }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const [serverVersion, setServerVersion] = useState<string>('');

  useEffect(() => {
    getVersionInfo()
      .then((data) => {
        if (data?.version) setServerVersion(data.version);
      })
      .catch(() => {});
  }, []);

  return (
    <SettingsRow
      icon={Info}
      label="关于"
      description={serverVersion ? `AiJee ${serverVersion}` : undefined}
      isLast={isLast}
      right={
        <Text style={{ fontSize: m.valueSize, fontFamily: Fonts.sans, color: p.textTertiary }}>
          {serverVersion || '—'}
        </Text>
      }
    />
  );
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
    getVersionInfo()
      .then((data) => {
        if (data?.version) setServerVersion(data.version);
        setVersionInfo(data ?? null);
      })
      .catch(() => {});
  }, []);

  const checkLatest = useCallback(async () => {
    setCheckState('checking');
    try {
      const result = await client.get({ url: '/api/version/latest' });
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
  const currentReleaseTag = timeline.find((release) => release.tag === versionLabel)?.tag ?? timeline[0]?.tag ?? null;
  const latestLabel = release?.latest ? release.latest.replace(/^v/i, '') : null;

  const heroBuildMeta = `构建于 ${formatReleaseTime(versionInfo?.updated_at)}${versionSuffix ? ` · ${versionSuffix}` : ''}`;

  return (
    <View style={{ gap: m.groupGap }}>
      {/* 1 · Hero: version number + build meta + update check */}
      <AboutGroup title="当前版本">
        <View style={aboutStyles.hero}>
          <View style={aboutStyles.heroMain}>
            <Text style={[aboutStyles.heroVersion, { color: p.text }]}>{versionLabel}</Text>
            <Text style={[aboutStyles.heroMeta, { color: p.textTertiary }]} numberOfLines={2}>
              {heroBuildMeta}
            </Text>
          </View>
          <View style={aboutStyles.heroAction}>
            {checkState === 'checking' ? (
              <View style={[aboutStyles.heroBtn, { borderColor: p.separator }]}>
                <Spinner size="small" color={p.textTertiary} />
                <Text style={[aboutStyles.heroBtnText, { color: p.textTertiary }]}>检查中…</Text>
              </View>
            ) : checkState === 'error' ? (
              <Pressable
                onPress={() => void checkLatest()}
                accessibilityRole="button"
                accessibilityLabel="重新检查更新"
                style={({ pressed }) => [aboutStyles.heroBtn, { borderColor: p.separator }, pressed && { backgroundColor: p.pressed }]}
              >
                <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />
                <Text style={[aboutStyles.heroBtnText, { color: p.textSecondary }]}>检查失败</Text>
              </Pressable>
            ) : release?.update_available && latestLabel ? (
              <Pressable
                onPress={openRelease}
                accessibilityRole="button"
                accessibilityLabel={`v${latestLabel} 可用，查看发布页`}
                style={({ pressed }) => [aboutStyles.heroBtnAccent, { backgroundColor: p.accent }, pressed && { opacity: 0.85 }]}
              >
                <ArrowUpCircle size={16} color={p.onAccent} strokeWidth={1.8} />
                <Text style={[aboutStyles.heroBtnTextAccent, { color: p.onAccent }]}>v{latestLabel} 可用</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void checkLatest()}
                accessibilityRole="button"
                accessibilityLabel="检查更新"
                style={({ pressed }) => [aboutStyles.heroBtn, { borderColor: p.separator }, pressed && { backgroundColor: p.pressed }]}
              >
                {checkState === 'checked' ? (
                  <CheckCircle2 size={14} color={p.success} strokeWidth={1.8} />
                ) : (
                  <RefreshCw size={14} color={p.textSecondary} strokeWidth={1.8} />
                )}
                <Text style={[aboutStyles.heroBtnText, { color: checkState === 'checked' ? p.success : p.textSecondary }]}>
                  {checkState === 'checked' ? '已是最新' : '检查更新'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </AboutGroup>

      {/* 2 · Changelog timeline */}
      <AboutGroup title={`更新日志 (${timeline.length})`}>
        {timeline.length ? (
          <View style={aboutStyles.timelineBlock}>
            <View style={[aboutStyles.timelineRail, { backgroundColor: p.border }]} />
            {timeline.map((releaseEntry, index) => (
              <ReleaseRow
                key={releaseEntry.tag}
                release={releaseEntry}
                current={releaseEntry.tag === currentReleaseTag}
                defaultOpen={index === 0}
              />
            ))}
          </View>
        ) : (
          <View style={aboutStyles.timelineEmpty}>
            <Text style={[aboutStyles.timelineTime, { color: p.textTertiary }]}>当前构建未附带发布记录。</Text>
          </View>
        )}
      </AboutGroup>

    </View>
  );
}
