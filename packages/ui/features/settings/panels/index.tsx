import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  ArrowUpCircle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Info,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
  Volume2,
} from 'lucide-react-native';
import { Fonts, type AccentPreset, type ThemePreset } from '@/constants/theme';
import { client, sdk, unwrapApiData } from '@aijee/client-sdk';
import type { PackageStatus } from '@aijee/client-sdk';

import { useAppSettingsStore, type ThemeMode } from '../store';
import {
  SettingsGroup,
  SettingsRow,
  SettingsSwitch,
  useSettingsMetrics,
  useSettingsPhoneLayout,
  useSettingsPalette,
} from '../components/settings-list';
import { Select } from '@/components/ui/select';

const {
  status2: getPackageStatus,
  update: updatePackage,
  install: installPackage,
} = sdk;

type ReleaseNote = { type: 'feature' | 'fix' | 'other'; title: string; scope?: string | null; commit?: string | null };

type VersionInfo = {
  version?: string;
  tag?: string;
  commit?: string | null;
  updated_at?: string | null;
  timeline?: Array<{ tag: string; published_at: string | null; commit: string | null; notes?: ReleaseNote[] }>;
  node?: string;
  remote?: boolean;
  server_id?: string;
};

type LatestRelease = {
  current?: string | null;
  latest?: string | null;
  update_available?: boolean;
  release_url?: string | null;
  published_at?: string | null;
  checked_at?: number | null;
};

function formatReleaseTime(value: string | null | undefined): string {
  if (!value) return '时间未知';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Compact release timestamp: `08-30 11:23`, year shown only when it differs. */
function formatReleaseShort(value: string | null | undefined): string {
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
function parseDescribeTag(value: string | null | undefined): { tag: string; ahead: number; dirty: boolean } | null {
  if (!value) return null;
  const match = value.match(/^(v[^-]+)(?:-(\d+)-g[0-9a-f]+)?(?:-dirty)?$/i);
  if (!match) return null;
  return { tag: match[1], ahead: match[2] ? Number(match[2]) : 0, dirty: /-dirty$/.test(value) };
}

async function getVersionInfo(): Promise<VersionInfo> {
  const result = await client.get({ url: '/api/version' });
  return unwrapApiData(result.data) as VersionInfo;
}

/**
 * Settings content, split by topic.
 *
 * Each topic exports a `Panel` (a full grouped section, used on the wide
 * stacked page and on drill-down detail screens) and — where the whole topic
 * fits in one row — a `Row` that resolves inline on the index list instead of
 * pushing a screen. Appearance and About are `Row` topics: switching a theme
 * and seeing/applying the agent version are single actions, so making the user
 * open a screen for them is pure friction.
 */

// ─── 外观 ─────────────────────────────────────────────────────

const THEMES: {
  key: ThemeMode;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
}[] = [
  { key: 'light', icon: Sun, label: '浅色' },
  { key: 'dark', icon: Moon, label: '深色' },
  { key: 'system', icon: Monitor, label: '跟随系统' },
];

const PRESETS: Array<{ key: ThemePreset; label: string; description: string }> = [
  { key: 'radix', label: 'Radix', description: '克制、清晰的产品灰阶' },
  { key: 'codex', label: 'Codex', description: 'ChatGPT 风格深色主题' },
  { key: 'vercel', label: 'Vercel', description: '黑白高对比开发者主题' },
];

const ACCENTS: Array<{ key: AccentPreset; label: string; color: string }> = [
  { key: 'blue', label: '蓝', color: '#2563EB' },
  { key: 'violet', label: '紫', color: '#7C3AED' },
  { key: 'teal', label: '青', color: '#0F766E' },
  { key: 'orange', label: '橙', color: '#C2410C' },
  { key: 'pink', label: '粉', color: '#BE185D' },
  { key: 'green', label: '绿', color: '#15803D' },
];

function themeEntry(mode: ThemeMode) {
  return THEMES.find((t) => t.key === mode) ?? THEMES[2];
}

/** Icon-only theme picker. Tapping an icon applies it immediately. */
function ThemePicker({
  value,
  onChange,
  compact = false,
  wide = false,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
  compact?: boolean;
  wide?: boolean;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const size = compact ? m.rowMinHeight - 12 : undefined;

  return (
    <View style={[pickerStyles.group, !compact && pickerStyles.labeledGroup, wide && [pickerStyles.wideGroup, { width: phone ? 260 : 440 }], { backgroundColor: p.tile, borderRadius: m.tileRadius + 2 }]}>
      {THEMES.map(({ key, icon: Icon, label }) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`主题：${label}`}
            hitSlop={4}
            style={({ pressed }) => [
              pickerStyles.item,
              compact
                ? { width: size, height: size, borderRadius: m.tileRadius }
                : wide
                  ? pickerStyles.wideItem
                : { borderRadius: m.tileRadius, paddingHorizontal: 10, minHeight: 30 },
              active && { backgroundColor: compact ? p.card : p.accent, borderColor: compact ? p.separator : p.accent },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Icon
              size={m.tileIcon + 2}
              color={active ? (compact ? p.text : p.onAccent) : p.textTertiary}
              strokeWidth={active ? 2.2 : 1.8}
            />
            {!compact ? <Text style={{ color: active ? p.onAccent : p.textTertiary, fontSize: m.descSize, fontFamily: Fonts.sans }}>{label}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function useThemeMode() {
  const { themeMode, loaded, load, update } = useAppSettingsStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);
  return { themeMode, update };
}

/**
 * Index-list row. Resolves inline: no chevron, no screen push — the icons are
 * the control.
 */
export function AppearanceRow({ isLast }: { isLast?: boolean }) {
  const { themeMode, update } = useThemeMode();
  const current = themeEntry(themeMode);

  return (
    <SettingsRow
      icon={current.icon}
      label="外观"
      description={current.label}
      isLast={isLast}
      right={<ThemePicker value={themeMode} onChange={(v) => update({ themeMode: v })} compact />}
    />
  );
}

export function AppearancePanel() {
  const p = useSettingsPalette();
  const { themeMode, update } = useThemeMode();
  const themePreset = useAppSettingsStore((s) => s.themePreset);
  const accentPreset = useAppSettingsStore((s) => s.accentPreset);
  const uiFontSize = useAppSettingsStore((s) => s.uiFontSize);
  const codeFontSize = useAppSettingsStore((s) => s.codeFontSize);

  return (
    <SettingsGroup header="外观">
    <SettingsRow
      label="外观模式"
      right={<ThemePicker value={themeMode} onChange={(value) => update({ themeMode: value })} compact />}
    />
      <SettingsRow
        label="主题预设"
        right={
          <Select
            value={themePreset}
            options={PRESETS.map((item) => ({ value: item.key, label: item.label }))}
            onChange={(value) => update({ themePreset: value })}
            style={appearanceStyles.themeSelect}
          />
        }
      />
      <SettingsRow
        label="强调色"
        right={
          <Select
            value={accentPreset}
            options={ACCENTS.map((item) => ({ value: item.key, label: item.label }))}
            onChange={(value) => update({ accentPreset: value })}
            style={appearanceStyles.accentSelect}
          />
        }
      />
      <SettingsRow label="UI 字号" right={<SizeStepper value={uiFontSize} onChange={(value) => update({ uiFontSize: value })} min={12} max={18} palette={p} />} />
      <SettingsRow label="代码字号" isLast right={<SizeStepper value={codeFontSize} onChange={(value) => update({ codeFontSize: value })} min={11} max={18} palette={p} />} />
    </SettingsGroup>
  );
}

function SizeStepper({ value, onChange, min, max, palette }: { value: number; onChange: (value: number) => void; min: number; max: number; palette: ReturnType<typeof useSettingsPalette> }) {
  return (
    <View style={[appearanceStyles.stepper, { borderColor: palette.border, backgroundColor: palette.tile }]}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} accessibilityLabel="减小字号" style={({ pressed }) => [appearanceStyles.stepButton, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: palette.border }, pressed && { backgroundColor: palette.pressed }]}><Text style={{ color: palette.text }}>−</Text></Pressable>
      <Text style={[appearanceStyles.stepperValue, { color: palette.text }]}>{value}px</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} accessibilityLabel="增大字号" style={({ pressed }) => [appearanceStyles.stepButton, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: palette.border }, pressed && { backgroundColor: palette.pressed }]}><Text style={{ color: palette.text }}>+</Text></Pressable>
    </View>
  );
}

const appearanceStyles = StyleSheet.create({
  themeSelect: { width: 140, maxWidth: '100%' },
  accentSelect: { width: 140, maxWidth: '100%' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'hidden' },
  stepButton: { width: 32, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { width: 48, textAlign: 'center', fontFamily: Fonts.mono, fontSize: 12 },
});

// ─── 通知 ─────────────────────────────────────────────────────

export function NotificationsPanel() {
  const { pushNotifications, soundEffects, loaded, load, update } = useAppSettingsStore();

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <SettingsGroup header="通知">
      <SettingsRow
        icon={Bell}
        label="推送通知"
        description="接收会话更新提醒"
        right={
          <SettingsSwitch
            value={pushNotifications}
            onValueChange={(v) => update({ pushNotifications: v })}
            accessibilityLabel="推送通知"
          />
        }
      />
      <SettingsRow
        icon={Volume2}
        label="音效"
        description="为操作与提醒播放声音"
        isLast
        right={
          <SettingsSwitch
            value={soundEffects}
            onValueChange={(v) => update({ soundEffects: v })}
            accessibilityLabel="音效"
          />
        }
      />
    </SettingsGroup>
  );
}

// ─── 数据 ─────────────────────────────────────────────────────

// ─── 关于 / Pi Agent ─────────────────────────────────────────

const PLATFORM_LABEL =
  Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';

/** Agent package status plus the install/update action. */
function useAgentPackage() {
  const [pkg, setPkg] = useState<PackageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPackageStatus();
      const data = unwrapApiData(result.data) as PackageStatus | undefined;
      setPkg(data ?? null);
    } catch {
      setError('无法获取包状态');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const apply = useCallback(async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);
    try {
      if (pkg && !pkg.installed) {
        await installPackage();
        setSuccess('Pi agent 安装成功');
      } else {
        await updatePackage();
        setSuccess('Pi agent 更新成功');
      }
      await fetchStatus();
    } catch {
      setError('更新失败，请查看服务器日志。');
    } finally {
      setUpdating(false);
    }
  }, [pkg, fetchStatus]);

  const needsInstall = !!pkg && !pkg.installed;
  const hasUpdate = !!(
    pkg?.installed &&
    pkg.latest_version &&
    pkg.installed_version &&
    pkg.latest_version !== pkg.installed_version
  );

  return {
    pkg,
    loading,
    updating,
    error,
    success,
    needsInstall,
    hasUpdate,
    /** True when there is something actionable to offer. */
    actionable: needsInstall || hasUpdate,
    apply,
  };
}

/** Filled pill that installs or updates the agent. */
function AgentActionButton({
  label,
  icon: Icon,
  updating,
  onPress,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  updating: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      disabled={updating}
      accessibilityRole="button"
      accessibilityLabel={`${label} Pi agent`}
      style={({ pressed }) => [
        pkgStyles.actionBtn,
        { backgroundColor: p.accent, minHeight: m.rowMinHeight - 16 },
        pressed && { opacity: 0.6 },
        updating && { opacity: 0.5 },
      ]}
    >
      {updating ? (
        <ActivityIndicator size="small" color={p.onAccent} />
      ) : (
        <>
          <Icon size={13} color={p.onAccent} strokeWidth={2.2} />
          <Text style={[pkgStyles.actionBtnText, { color: p.onAccent }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function AgentBanner({ text, ok }: { text: string; ok: boolean }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  // Tinted from the palette rather than fixed iOS colours, so the banner keeps
  // its contrast in both themes.
  const tint = ok
    ? p.isDark
      ? 'rgba(63,185,80,0.14)'
      : 'rgba(26,127,55,0.10)'
    : p.isDark
      ? 'rgba(248,81,73,0.14)'
      : 'rgba(207,34,46,0.10)';

  return (
    <View
      style={[
        pkgStyles.messageBanner,
        { marginHorizontal: m.gutter, backgroundColor: tint },
      ]}
    >
      {ok ? (
        <CheckCircle2 size={13} color={p.success} strokeWidth={2} />
      ) : (
        <AlertCircle size={13} color={p.destructive} strokeWidth={2} />
      )}
      <Text
        style={[
          pkgStyles.messageText,
          { fontSize: m.descSize, color: ok ? p.success : p.destructive },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

/**
 * Index-list row. Shows the agent version outright, and swaps the version text
 * for an update/install button the moment one is available — no screen push
 * needed to find out or to act.
 */
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
                <ActivityIndicator size="small" color={p.textTertiary} />
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

/** One collapsible release row in the changelog timeline. */
function ReleaseRow({
  release,
  current,
  defaultOpen,
}: {
  release: NonNullable<VersionInfo['timeline']>[number];
  current: boolean;
  defaultOpen: boolean;
}) {
  const p = useSettingsPalette();
  const [open, setOpen] = useState(defaultOpen);
  const notes = release.notes ?? [];
  const featureTotal = notes.filter((note) => note.type === 'feature').length;
  const fixTotal = notes.filter((note) => note.type === 'fix').length;
  const otherTotal = notes.filter((note) => note.type === 'other').length;
  const countText =
    [featureTotal && `${featureTotal} 新功能`, fixTotal && `${fixTotal} 修复`, otherTotal && `${otherTotal} 其他`]
      .filter(Boolean)
      .join(' · ') || '无变更记录';

  return (
    <View>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={`${release.tag}，发布于 ${formatReleaseTime(release.published_at)}，${countText}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [aboutStyles.releaseHead, (pressed || open) && { backgroundColor: p.pressed }]}
      >
        <View style={[aboutStyles.timelineDot, { backgroundColor: current ? p.accent : p.textTertiary }]} />
        <Text numberOfLines={1} style={[aboutStyles.timelineTag, { color: current ? p.text : p.textSecondary }]}>
          {release.tag}
        </Text>
        <Text style={[aboutStyles.timelineTime, { color: p.textTertiary }]}>
          {formatReleaseShort(release.published_at)}
        </Text>
        <Text numberOfLines={1} style={[aboutStyles.releaseCount, { color: p.textTertiary }]}>
          {countText}
        </Text>
        {current ? (
          <View style={[aboutStyles.currentBadge, { backgroundColor: p.tile }]}>
            <Text style={[aboutStyles.currentBadgeText, { color: p.textSecondary }]}>当前</Text>
          </View>
        ) : null}
        {open ? (
          <ChevronUp size={14} color={p.textTertiary} strokeWidth={2} />
        ) : (
          <ChevronDown size={14} color={p.textTertiary} strokeWidth={2} />
        )}
      </Pressable>
      {open ? (
        <View style={[aboutStyles.releaseBody, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.separator }]}>
          {(['feature', 'fix', 'other'] as const).map((type) => {
            const items = notes.filter((note) => note.type === type);
            if (!items.length) return null;
            const label = type === 'feature' ? '新功能' : type === 'fix' ? '修复' : '其他';
            return (
              <View key={type} style={aboutStyles.noteGroup}>
                <Text style={[aboutStyles.noteCat, { color: p.textSecondary }]}>
                  {label} · {items.length}
                </Text>
                {items.map((note, index) => (
                  <View key={`${note.commit}-${index}`} style={aboutStyles.noteRow}>
                    <Text numberOfLines={2} style={[aboutStyles.noteTitle, { color: p.text }]}>
                      {note.title}
                    </Text>
                    {note.commit ? (
                      <Text style={[aboutStyles.noteCommit, { color: p.textTertiary }]}>{note.commit}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            );
          })}
          {!notes.length ? (
            <Text style={[aboutStyles.timelineTime, { color: p.textTertiary }]}>无变更记录</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Group header that survives the SettingsHeadingProvider suppression. */
function AboutGroup({ title, children }: { title: string; children: ReactNode }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[aboutStyles.groupTitle, { color: p.textSecondary }]}>{title}</Text>
      <View
        style={{
          backgroundColor: p.card,
          borderRadius: m.cardRadius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: p.separator,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ─── 样式 ─────────────────────────────────────────────────────

const aboutStyles = StyleSheet.create({
  groupTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  // ── Hero ──
  hero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: 16 },
  heroMain: { flex: 1, minWidth: 0, gap: 6 },
  heroVersion: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.mono },
  heroMeta: { fontSize: 12, fontFamily: Fonts.sans },
  heroAction: { flexShrink: 0 },
  heroBtn: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  heroBtnAccent: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 8 },
  heroBtnText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  heroBtnTextAccent: { fontSize: 12, fontFamily: Fonts.sansMedium },
  // ── Changelog timeline ──
  timelineBlock: { position: 'relative' },
  // One continuous rail from the first dot's top to the last dot's bottom
  // (rows are fixed at 44, so 18 == dot top offset in every row).
  timelineRail: { position: 'absolute', left: 15.5, top: 18, bottom: 18, width: StyleSheet.hairlineWidth },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineTag: { fontSize: 13, fontFamily: Fonts.mono, flexShrink: 0 },
  timelineTime: { fontSize: 12, fontFamily: Fonts.sans, flexShrink: 0 },
  releaseHead: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  releaseCount: { flex: 1, minWidth: 0, fontSize: 11, fontFamily: Fonts.sans, flexShrink: 1 },
  releaseBody: { paddingHorizontal: 28, paddingVertical: 12, gap: 12 },
  noteGroup: { gap: 6 },
  noteCat: { fontSize: 12, fontFamily: Fonts.sansSemiBold },
  noteRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  noteTitle: { flex: 1, fontSize: 13, fontFamily: Fonts.sans, lineHeight: 18 },
  noteCommit: { fontSize: 11, fontFamily: Fonts.mono, flexShrink: 0 },
  currentBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 2 },
  currentBadgeText: { fontSize: 11, fontFamily: Fonts.sansMedium },
  timelineEmpty: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
});

const pickerStyles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  labeledGroup: {
    gap: 3,
  },
  wideGroup: {
    maxWidth: '100%',
    gap: 3,
    padding: 3,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  wideItem: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    gap: 7,
    borderRadius: 7,
  },
});

const pkgStyles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  upToDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upToDateText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  messageText: {
    fontFamily: Fonts.sans,
    flex: 1,
  },
});
