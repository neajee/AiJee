import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Download, ExternalLink, Search, ShieldAlert, X } from 'lucide-react-native';

import { usePiClient } from '@aijee/client-sdk';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { AppModal } from '@/components/ui';
import {
  useSettingsMetrics,
  useSettingsPalette,
  useSettingsPhoneLayout,
} from '@/features/settings/components/settings-list';

/**
 * The plugin marketplace.
 *
 * A standalone page rather than a settings section — browsing a registry wants
 * the full width — but it borrows the settings palette and metrics so it reads
 * as the same product as the sidebar next to it: greyscale, hairline borders,
 * 6–8px radii. Nothing here is tinted for decoration; colour is reserved for
 * the permission warning, which is the one thing worth interrupting for.
 */

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'Extension', label: '扩展' },
  { value: 'Skill', label: '技能' },
  { value: 'Prompt', label: '提示词' },
  { value: 'Theme', label: '主题' },
];

const SEARCH_DEBOUNCE_MS = 350;
const CARD_MIN_WIDTH = 340;

type Tab = 'discover' | 'installed';

export function PackageMarketplace() {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();

  const [tab, setTab] = useState<Tab>('installed');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<MarketplacePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [installedOutput, setInstalledOutput] = useState<string | null>(null);
  const [installedLoading, setInstalledLoading] = useState(false);
  const [installedMessage, setInstalledMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<MarketplacePackage | null>(null);

  // Typing shouldn't fire a request per keystroke, but waiting for Enter hides
  // results from anyone who expects search-as-you-type.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const search = useCallback(
    async (searchQuery: string, searchCategory: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await client.api.marketplaceSearch({
          query: searchQuery,
          category: searchCategory,
          limit: 30,
        });
        setItems(result.packages);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载插件失败');
      } finally {
        setLoading(false);
      }
    },
    [client],
  );

  useEffect(() => {
    if (tab !== 'discover') return;
    void search(debouncedQuery, category);
  }, [tab, debouncedQuery, category, search]);

  const loadInstalled = useCallback(async () => {
    setInstalledLoading(true);
    setError(null);
    try {
      const result = await client.api.marketplaceInstalled();
      setInstalledOutput(result.output?.trim() || '暂无已安装插件');
    } catch (e) {
      setError(e instanceof Error ? e.message : '读取已安装插件失败');
    } finally {
      setInstalledLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (tab === 'installed' && installedOutput === null) void loadInstalled();
  }, [tab, installedOutput, loadInstalled]);

  const openDetail = useCallback((pkg: MarketplacePackage) => setSelected(pkg), []);

  const handleInstalled = useCallback(
    (output: string) => {
      setInstalledMessage(output.trim() || '任务已提交，完成后刷新已安装列表');
      setInstalledOutput(null);
      setSelected(null);
      setTab('installed');
    },
    [],
  );

  const gutter = phone ? m.gutter : m.gutter + 6;

  return (
    <View style={[styles.page, { backgroundColor: p.bg }]}>
      <View style={[styles.header, { paddingHorizontal: gutter, borderBottomColor: p.separator }]}>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: p.text, fontSize: m.titleSize - 4 }]}>
            插件广场
          </Text>
          <Text style={[styles.subtitle, { color: p.textTertiary, fontSize: m.descSize }]}>
            从 npm 发现 Pi 的扩展、技能与主题
          </Text>
        </View>
        <Segmented
          options={[
            { value: 'installed', label: '已安装' },
            { value: 'discover', label: '发现' },
          ]}
          value={tab}
          onChange={(value) => setTab(value as Tab)}
        />
      </View>

      {tab === 'discover' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: gutter, gap: m.groupGap }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 10 }}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              onSubmit={() => void search(query, category)}
            />
            <View style={styles.chips}>
              {CATEGORIES.map((item) => (
                <Chip
                  key={item.value}
                  label={item.label}
                  active={category === item.value}
                  onPress={() => setCategory(item.value)}
                />
              ))}
            </View>
          </View>

          {error ? <Notice text={error} tone="error" /> : null}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={p.textTertiary} />
            </View>
          ) : items.length === 0 ? (
            <Text style={[styles.emptyText, { color: p.textTertiary, fontSize: m.descSize }]}>
              没有匹配的插件。
            </Text>
          ) : (
            <View style={styles.grid}>
              {items.map((item) => (
                <PackageCard
                  key={item.name}
                  pkg={item}
                  single={phone}
                  onPress={() => void openDetail(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <InstalledView
          output={installedOutput}
          loading={installedLoading}
          error={error}
          onRefresh={loadInstalled}
          gutter={gutter}
          single={phone}
          message={installedMessage}
        />
      )}

      <PackageDetail
        pkg={selected}
        onClose={() => setSelected(null)}
        onInstalled={handleInstalled}
      />
    </View>
  );
}

// ─── Header controls ──────────────────────────────────────────

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: p.tile, borderRadius: m.tileRadius + 2 },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed, hovered }: any) => [
              styles.segment,
              { borderRadius: m.tileRadius },
              active && { backgroundColor: p.card, borderColor: p.separator },
              !active && hovered && { backgroundColor: p.pressed },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text
              style={{
                fontSize: m.descSize,
                fontFamily: active ? Fonts.sansMedium : Fonts.sans,
                color: active ? p.text : p.textTertiary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchField({
  value,
  onChangeText,
  onSubmit,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.search,
        { backgroundColor: p.tile, borderColor: p.separator, borderRadius: m.tileRadius },
      ]}
    >
      <Search size={14} color={p.textTertiary} strokeWidth={1.8} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="搜索插件名称或关键词"
        placeholderTextColor={p.textTertiary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="搜索插件"
        style={[styles.searchInput, { color: p.text, fontSize: m.valueSize }]}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="清空搜索"
          hitSlop={6}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <X size={13} color={p.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.chip,
        { borderColor: active ? p.border : p.separator },
        active && { backgroundColor: p.tile },
        !active && hovered && { backgroundColor: p.pressed },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text
        style={{
          fontSize: m.descSize,
          fontFamily: active ? Fonts.sansMedium : Fonts.sans,
          color: active ? p.text : p.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── List ─────────────────────────────────────────────────────

function PackageCard({
  pkg,
  single,
  onPress,
}: {
  pkg: MarketplacePackage;
  /** Narrow viewport: one card per row instead of a wrapping grid. */
  single: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pkg.name} 详情`}
      style={({ pressed, hovered }: any) => [
        styles.card,
        {
          backgroundColor: p.card,
          borderColor: p.separator,
          borderRadius: m.cardRadius,
          padding: m.gutter,
          width: single ? '100%' : undefined,
          flexBasis: single ? undefined : CARD_MIN_WIDTH,
        },
        hovered && { borderColor: p.border, backgroundColor: p.isDark ? p.tile : p.card },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.cardTop}>
        <Text
          style={[styles.cardName, { color: p.text, fontSize: m.labelSize }]}
          numberOfLines={1}
        >
          {pkg.name}
        </Text>
        <Text style={[styles.version, { color: p.textTertiary }]}>v{pkg.version}</Text>
      </View>
      <Text
        style={[styles.cardDesc, { color: p.textSecondary, fontSize: m.descSize }]}
        numberOfLines={2}
      >
        {pkg.description || '作者未提供介绍'}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.meta, { color: p.textTertiary }]} numberOfLines={1}>
          {pkg.package_types.join(' · ') || 'npm'}
        </Text>
        {pkg.downloads ? (
          <Text style={[styles.meta, { color: p.textTertiary }]}>
            {pkg.downloads.toLocaleString()} 次/周
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function InstalledView({
  output,
  loading,
  error,
  onRefresh,
  gutter,
  single,
  message,
}: {
  output: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  gutter: number;
  single: boolean;
  message: string | null;
}) {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ padding: gutter, gap: 10 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.installedHeader}>
        <Text style={{ fontSize: m.headerSize, fontFamily: Fonts.sansMedium, color: p.textSecondary }}>
          服务器上已安装的插件
        </Text>
        <View style={styles.installedActions}><SecondaryButton label="全部更新" onPress={() => void client.api.marketplaceOperation({ operation: 'update', name: '*', scope: 'user' })} /><SecondaryButton label="刷新" onPress={onRefresh} /></View>
      </View>

      {message ? <Text style={[styles.operationMessage, { color: p.textSecondary, backgroundColor: p.tile, borderColor: p.separator, borderRadius: m.tileRadius }]}>{message}</Text> : null}
      {error ? <Notice text={error} tone="error" /> : null}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="small" color={p.textTertiary} /></View>
      ) : output === '暂无已安装插件' ? (
        <Text style={[styles.emptyText, { color: p.textTertiary, fontSize: m.descSize }]}>暂无已安装插件。</Text>
      ) : (
        <View style={styles.installedGrid}>
          {parseInstalledPackages(output).map((pkg, index) => (
            <InstalledPackageCard
              key={`${pkg.name}-${index}`}
              pkg={pkg}
              single={single}
              onUpdate={() => void client.api.marketplaceOperation({ operation: 'update', name: pkg.name, scope: 'user' }).then(onRefresh)}
              onRemove={() => void client.api.marketplaceOperation({ operation: 'remove', name: pkg.name, scope: 'user' }).then(onRefresh)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

type InstalledPackage = { name: string; detail: string | null };

function parseInstalledPackages(output: string | null): InstalledPackage[] {
  return (output ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '暂无已安装插件')
    .map((line) => {
      const match = line.match(/^([^\s]+)(?:\s+\[([^\]]+)\])?(?:\s+(.*))?$/);
      return {
        name: match?.[1] || line,
        detail: [match?.[2], match?.[3]].filter(Boolean).join(' · ') || null,
      };
    });
}

function InstalledPackageCard({
  pkg,
  single,
  onUpdate,
  onRemove,
}: {
  pkg: InstalledPackage;
  single: boolean;
  onUpdate: () => void;
  onRemove: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.installedCard,
        {
          backgroundColor: p.card,
          borderColor: p.separator,
          borderRadius: m.cardRadius,
          padding: m.gutter,
          width: single ? '100%' : undefined,
          flexBasis: single ? undefined : CARD_MIN_WIDTH,
        },
      ]}
    >
      <View style={styles.installedCardTop}>
        <View style={styles.installedCopy}>
          <Text style={[styles.installedName, { color: p.text, fontSize: m.labelSize }]} numberOfLines={1}>{pkg.name}</Text>
          {pkg.detail ? <Text style={[styles.meta, { color: p.textTertiary }]} numberOfLines={1}>{pkg.detail}</Text> : null}
        </View>
      </View>
      <View style={[styles.installedFooter, { borderTopColor: p.separator }]}>
        <InstalledAction label="更新" onPress={onUpdate} />
        <InstalledAction label="卸载" destructive onPress={onRemove} />
      </View>
    </View>
  );
}

function InstalledAction({
  label,
  destructive = false,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = destructive ? p.destructive : p.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [styles.installedAction, hovered && { backgroundColor: p.pressed }, pressed && { opacity: 0.6 }]}
    >
      <Text style={{ color, fontSize: m.descSize, fontFamily: Fonts.sansMedium }}>{label}</Text>
    </Pressable>
  );
}

// ─── Detail dialog ────────────────────────────────────────────

function PackageDetail({
  pkg,
  onClose,
  onInstalled,
}: {
  pkg: MarketplacePackage | null;
  onClose: () => void;
  onInstalled: (output: string) => void;
}) {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const { height: screenHeight } = useWindowDimensions();

  const [installing, setInstalling] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const nameRef = useRef<string | null>(null);

  // Reset the form whenever a different package opens the dialog.
  useEffect(() => {
    if (!pkg || nameRef.current === pkg.name) return;
    nameRef.current = pkg.name;
    setInstalling(false);
    setFailure(null);
  }, [pkg]);

  const target = pkg?.version || 'latest';

  const install = useCallback(async () => {
    if (!pkg) return;
    setInstalling(true);
    setFailure(null);
    try {
      const result = await client.api.marketplaceOperation({
        operation: 'install',
        name: pkg.name,
        version: target,
        scope: 'user',
        lock_version: true,
        workspace_id: null,
      });
      onInstalled(result.output || '安装完成');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '安装失败');
    } finally {
      setInstalling(false);
    }
  }, [client, pkg, target, onInstalled]);

  if (!pkg) return null;

  const maxHeight = Math.min(screenHeight - 64, 680);

  return (
    <AppModal
      visible
      onClose={onClose}
      contentStyle={[
        styles.dialog,
        {
          backgroundColor: p.card,
          borderColor: p.border,
          borderRadius: phone ? 0 : m.cardRadius + 4,
          width: phone ? '100%' : 560,
          height: phone ? '100%' : undefined,
          maxHeight: phone ? undefined : maxHeight,
        },
      ]}
    >
        <View
          style={[
            styles.dialogInner,
          ]}
        >
          <View style={[styles.dialogHeader, { borderBottomColor: p.separator, padding: m.gutter }]}>
            <View style={styles.dialogTitleCol}>
              <Text
                style={[styles.dialogTitle, { color: p.text, fontSize: m.labelSize + 2 }]}
                numberOfLines={1}
              >
                {pkg.name}
              </Text>
              <Text style={[styles.meta, { color: p.textTertiary }]}>
                v{pkg.version}
                {pkg.author ? ` · ${pkg.author}` : ''}
                {pkg.package_types.length ? ` · ${pkg.package_types.join('、')}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="关闭"
              hitSlop={8}
              style={({ pressed, hovered }: any) => [
                styles.iconButton,
                hovered && { backgroundColor: p.pressed },
                pressed && { opacity: 0.6 },
              ]}
            >
              <X size={16} color={p.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: m.gutter, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: p.textSecondary, fontSize: m.valueSize, lineHeight: m.valueSize * 1.5 }}>
              {pkg.description || '作者未提供介绍'}
            </Text>

            {failure ? <Notice text={failure} tone="error" /> : null}

          </ScrollView>

          <View style={[styles.dialogFooter, { borderTopColor: p.separator, padding: m.gutter }]}>
            {pkg.repository || pkg.homepage ? (
              <Pressable
                onPress={() => Linking.openURL((pkg.repository ?? pkg.homepage)!)}
                accessibilityRole="link"
                accessibilityLabel="打开仓库"
                style={({ pressed, hovered }: any) => [
                  styles.linkButton,
                  hovered && { backgroundColor: p.pressed },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <ExternalLink size={13} color={p.textSecondary} strokeWidth={1.8} />
                <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textSecondary }}>
                  仓库
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <PrimaryButton
              label="安装"
              icon={Download}
              busy={installing}
              onPress={() => void install()}
            />
          </View>
        </View>
    </AppModal>
  );
}

// ─── Shared bits ──────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return (
    <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sansMedium, color: p.textTertiary }}>
      {text}
    </Text>
  );
}

function Notice({ text, tone }: { text: string; tone: 'warning' | 'error' }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = tone === 'error' ? p.destructive : p.isDark ? '#D29922' : '#9A6700';
  const background =
    tone === 'error'
      ? p.isDark
        ? 'rgba(248,81,73,0.14)'
        : 'rgba(207,34,46,0.10)'
      : p.isDark
        ? 'rgba(210,153,34,0.14)'
        : 'rgba(154,103,0,0.10)';

  return (
    <View style={[styles.notice, { backgroundColor: background, borderRadius: m.tileRadius }]}>
      <ShieldAlert size={13} color={color} strokeWidth={2} />
      <Text style={{ flex: 1, fontSize: m.descSize, color, lineHeight: m.descSize * 1.45 }}>
        {text}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  icon: Icon,
  busy,
  onPress,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  busy?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: p.accent, borderColor: p.accent, borderRadius: m.tileRadius },
        (pressed || busy) && { opacity: 0.6 },
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={p.onAccent} />
      ) : (
        <>
          {Icon ? <Icon size={13} color={p.onAccent} strokeWidth={2.2} /> : null}
          <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sansMedium, color: p.onAccent }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.button,
        { borderColor: p.separator, borderRadius: m.tileRadius },
        hovered && { backgroundColor: p.pressed },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sansMedium, color: p.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: {
    fontFamily: Fonts.sans,
  },
  scroll: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  segment: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    paddingVertical: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  card: {
    flexGrow: 1,
    minWidth: CARD_MIN_WIDTH,
    maxWidth: 560,
    minHeight: 132,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
  },
  version: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  cardDesc: {
    fontFamily: Fonts.sans,
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  installedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  installedActions: { flexDirection: 'row', gap: 8 },
  operationMessage: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    fontFamily: Fonts.sans,
    borderWidth: StyleSheet.hairlineWidth,
  },
  installedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  installedCard: {
    flexGrow: 1,
    minWidth: CARD_MIN_WIDTH,
    minHeight: 112,
    justifyContent: 'space-between',
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  installedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  installedIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  installedCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  installedName: {
    fontFamily: Fonts.sansMedium,
  },
  installedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'stretch',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  installedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
  },
  backdropWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    maxWidth: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.22)',
    elevation: 12,
  },
  dialogInner: {
    flex: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dialogTitleCol: {
    flex: 1,
    gap: 3,
  },
  dialogTitle: {
    fontFamily: Fonts.sansSemiBold,
  },
  iconButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 32,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: Fonts.mono,
    borderWidth: StyleSheet.hairlineWidth,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commandBlock: {
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  commandText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.mono,
  },
  readme: {
    padding: 10,
    maxHeight: 220,
    maxWidth: '100%',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  readmeText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
  },
  dialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
