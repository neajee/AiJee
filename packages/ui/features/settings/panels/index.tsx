import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Download,
  Info,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  Volume2,
} from 'lucide-react-native';

import { Fonts } from '@/constants/theme';
import { sdk, unwrapApiData } from '@aijee/client-sdk';
import type { PackageStatus } from '@aijee/client-sdk';

import { useAppSettingsStore, type ThemeMode } from '../store';
import {
  SettingsGroup,
  SettingsIconTile,
  SettingsRow,
  SettingsSwitch,
  useSettingsMetrics,
  useSettingsPalette,
} from '../components/settings-list';

const {
  status2: getPackageStatus,
  update: updatePackage,
  install: installPackage,
  version: getVersion,
} = sdk;

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

function themeEntry(mode: ThemeMode) {
  return THEMES.find((t) => t.key === mode) ?? THEMES[2];
}

/** Icon-only theme picker. Tapping an icon applies it immediately. */
function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const size = m.rowMinHeight - 12;

  return (
    <View style={[pickerStyles.group, { backgroundColor: p.tile, borderRadius: m.tileRadius + 2 }]}>
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
              { width: size, height: size, borderRadius: m.tileRadius },
              active && { backgroundColor: p.card, borderColor: p.separator },
              pressed && { opacity: 0.55 },
            ]}
          >
            <Icon
              size={m.tileIcon + 2}
              color={active ? p.text : p.textTertiary}
              strokeWidth={active ? 2.2 : 1.8}
            />
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
      right={<ThemePicker value={themeMode} onChange={(v) => update({ themeMode: v })} />}
    />
  );
}

export function AppearancePanel() {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const { themeMode, update } = useThemeMode();

  return (
    <SettingsGroup header="外观">
      <View
        style={[
          panelStyles.inlineRow,
          {
            paddingHorizontal: m.gutter,
            paddingVertical: m.rowPaddingV,
            minHeight: m.rowMinHeight,
          },
        ]}
      >
        <SettingsIconTile icon={Palette} />
        <View style={panelStyles.inlineLabelCol}>
          <Text style={{ fontSize: m.labelSize, fontFamily: Fonts.sans, color: p.text }}>主题</Text>
        </View>
        <ThemePicker value={themeMode} onChange={(v) => update({ themeMode: v })} />
      </View>
    </SettingsGroup>
  );
}

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
  const agent = useAgentPackage();
  const [serverVersion, setServerVersion] = useState<string>('');

  useEffect(() => {
    getVersion()
      .then((res) => {
        const data = unwrapApiData(res.data) as { version?: string } | undefined;
        if (data?.version) setServerVersion(data.version);
      })
      .catch(() => {});
  }, []);

  const { pkg, loading, updating, hasUpdate, needsInstall, actionable, apply } = agent;

  let description: string;
  if (loading) {
    description = '正在检查更新…';
  } else if (needsInstall) {
    description = `Pi agent 未安装${pkg?.latest_version ? ` · 可安装 ${pkg.latest_version}` : ''}`;
  } else if (hasUpdate) {
    description = `Pi agent ${pkg?.installed_version} → ${pkg?.latest_version}`;
  } else if (pkg?.installed) {
    description = `Pi agent ${pkg.installed_version ?? '未知'}${
      serverVersion ? ` · 服务器 ${serverVersion}` : ''
    }`;
  } else {
    description = serverVersion ? `服务器 ${serverVersion}` : (agent.error ?? '');
  }

  let right: React.ReactNode;
  if (loading) {
    right = <ActivityIndicator size="small" color={p.textTertiary} />;
  } else if (actionable) {
    right = (
      <AgentActionButton
        label={needsInstall ? '安装' : '更新'}
        icon={needsInstall ? Download : RefreshCw}
        updating={updating}
        onPress={apply}
      />
    );
  } else {
    // No update pending: the version number is the whole story.
    right = (
      <Text style={{ fontSize: m.valueSize, fontFamily: Fonts.sans, color: p.textTertiary }}>
        {pkg?.installed_version ?? serverVersion ?? '—'}
      </Text>
    );
  }

  const banner = agent.success ?? agent.error;

  return (
    <>
      <SettingsRow
        icon={Info}
        label="关于"
        description={description || undefined}
        isLast={isLast && !banner}
        right={right}
      />
      {banner ? <AgentBanner text={banner} ok={!!agent.success} /> : null}
    </>
  );
}

/** Full section, used on the wide stacked page and the detail screen. */
export function AboutPanel() {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const agent = useAgentPackage();
  const [serverVersion, setServerVersion] = useState<string>('');

  useEffect(() => {
    getVersion()
      .then((res) => {
        const data = unwrapApiData(res.data) as { version?: string } | undefined;
        if (data?.version) setServerVersion(data.version);
      })
      .catch(() => {});
  }, []);

  const { pkg, loading, updating, hasUpdate, needsInstall, actionable, apply } = agent;

  const versionText = loading
    ? '正在检查更新…'
    : hasUpdate
      ? `可更新至 ${pkg?.latest_version}`
      : pkg?.installed
        ? ''
        : pkg?.latest_version
          ? `未安装 · 可安装 ${pkg.latest_version}`
          : (agent.error ?? '');

  let right: React.ReactNode;
  if (loading) {
    right = <ActivityIndicator size="small" color={p.textTertiary} />;
  } else if (actionable) {
    right = (
      <AgentActionButton
        label={needsInstall ? '安装' : '更新'}
        icon={needsInstall ? Download : RefreshCw}
        updating={updating}
        onPress={apply}
      />
    );
  } else if (pkg) {
    right = (
      <Text style={{ fontSize: m.valueSize, fontFamily: Fonts.sans, color: p.textTertiary }}>
        {pkg.installed_version ?? pkg.latest_version ?? '—'}
      </Text>
    );
  } else {
    right = <AlertCircle size={16} color={p.destructive} strokeWidth={2} />;
  }

  const banner = agent.success ?? agent.error;

  return (
    <SettingsGroup header="关于" footer={`AiJee · ${PLATFORM_LABEL}`}>
      <SettingsRow
        icon={Download}
        label="智能体版本"
        description={versionText || undefined}
        right={right}
      />
      {banner ? <AgentBanner text={banner} ok={!!agent.success} /> : null}
      <SettingsRow
        icon={Info}
        label="服务器版本"
        isLast
        right={
          <Text style={{ fontSize: m.valueSize, fontFamily: Fonts.sans, color: p.textTertiary }}>
            {serverVersion || '—'}
          </Text>
        }
      />
    </SettingsGroup>
  );
}

// ─── 样式 ─────────────────────────────────────────────────────

const panelStyles = StyleSheet.create({
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineLabelCol: {
    flex: 1,
  },
});

const pickerStyles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
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
