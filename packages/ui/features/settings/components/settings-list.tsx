import { createContext, memo, useContext, useMemo, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useResponsiveLayout } from '../../navigation/hooks/use-responsive-layout';

/**
 * Shared chrome for the settings screens.
 *
 * The layout has two densities:
 *  - `phone`  — grouped-list, thumb-sized rows, platform-legible type. Used on
 *               narrow viewports regardless of platform, so mobile *web* gets
 *               the same app-like treatment as the native builds.
 *  - desktop  — the same structure at a tighter density for pointer input.
 *
 * Density is decided by viewport width, not `Platform.OS`, because a phone
 * browser is a phone even though `Platform.OS === 'web'`.
 */

// ─── Layout context ───────────────────────────────────────────

const SettingsLayoutContext = createContext<boolean | null>(null);

export function SettingsLayoutProvider({
  phone,
  children,
}: {
  phone: boolean;
  children: ReactNode;
}) {
  return (
    <SettingsLayoutContext.Provider value={phone}>
      {children}
    </SettingsLayoutContext.Provider>
  );
}

/**
 * True when the settings UI should use the roomy grouped-list density.
 * Falls back to a viewport measurement so sections still work if rendered
 * outside a provider.
 */
export function useSettingsPhoneLayout(): boolean {
  const fromContext = useContext(SettingsLayoutContext);
  const { isWideScreen } = useResponsiveLayout();
  return fromContext ?? !isWideScreen;
}

// ─── Section heading visibility ───────────────────────

const SettingsHeadingContext = createContext(true);

/**
 * Hides the per-section headings inside their children.
 *
 * On the stacked settings page each section needs its own heading to be
 * findable. On a drill-down detail screen the screen title already says which
 * section you are in, so repeating it is noise. Wrapping in
 * `<SettingsHeadingProvider visible={false}>` suppresses both `SettingsGroup`
 * headers and the hand-rolled headings in the larger sections, without every
 * component having to thread a prop.
 */
export function SettingsHeadingProvider({
  visible,
  children,
}: {
  visible: boolean;
  children: ReactNode;
}) {
  return (
    <SettingsHeadingContext.Provider value={visible}>{children}</SettingsHeadingContext.Provider>
  );
}

export function useSettingsHeadingVisible(): boolean {
  return useContext(SettingsHeadingContext);
}

// ─── Metrics ──────────────────────────────────────────────────

export interface SettingsMetrics {
  gutter: number;
  groupGap: number;
  cardRadius: number;
  rowMinHeight: number;
  rowPaddingV: number;
  tileSize: number;
  tileRadius: number;
  tileIcon: number;
  labelSize: number;
  descSize: number;
  valueSize: number;
  headerSize: number;
  headerInset: number;
  titleSize: number;
  chevronSize: number;
  switchScale: number;
  contentMaxWidth?: number;
}

const PHONE_METRICS: SettingsMetrics = {
  gutter: 16,
  groupGap: 22,
  cardRadius: 12,
  // 48 keeps rows above the 44pt/48dp minimum target on both platforms.
  rowMinHeight: 48,
  rowPaddingV: 11,
  tileSize: 30,
  tileRadius: 8,
  tileIcon: 16,
  labelSize: 16,
  descSize: 13,
  valueSize: 15,
  headerSize: 13,
  headerInset: 16,
  titleSize: 30,
  chevronSize: 18,
  switchScale: 1,
};

/**
 * Wide viewports read as part of the app shell, so this set is tuned to the
 * sidebar next to it: same 13.5px label, same 6–8px radii, same hairline
 * borders. Anything chunkier makes settings look like a different product
 * bolted onto the side of the project tree.
 */
const DESKTOP_METRICS: SettingsMetrics = {
  gutter: 12,
  groupGap: 14,
  cardRadius: 8,
  rowMinHeight: 36,
  rowPaddingV: 8,
  tileSize: 22,
  tileRadius: 6,
  tileIcon: 13,
  labelSize: 13.5,
  descSize: 12,
  valueSize: 13,
  headerSize: 11,
  headerInset: 4,
  titleSize: 20,
  chevronSize: 14,
  switchScale: 0.8,
  contentMaxWidth: 640,
};

export function useSettingsMetrics(): SettingsMetrics {
  const phone = useSettingsPhoneLayout();
  return phone ? PHONE_METRICS : DESKTOP_METRICS;
}

// ─── Palette ──────────────────────────────────────────────────

export interface SettingsPalette {
  isDark: boolean;
  /** Page background. Tinted so cards read as cards. */
  bg: string;
  /** Grouped-card background. */
  card: string;
  /** Icon tile / inset field background. */
  tile: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  separator: string;
  border: string;
  pressed: string;
  accent: string;
  onAccent: string;
  success: string;
  destructive: string;
}

export function useSettingsPalette(): SettingsPalette {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const c = Colors[scheme];

  return useMemo(
    () => ({
      isDark,
      // Light: page steps *down* to the raised tone so white cards lift off it.
      // Dark: page stays at base and cards step up. Both use existing tokens
      // instead of a second hardcoded palette.
      bg: isDark ? c.background : c.surfaceRaised,
      card: isDark ? c.surfaceRaised : c.background,
      tile: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      text: c.text,
      textSecondary: c.textSecondary,
      textTertiary: c.textTertiary,
      separator: c.border,
      border: c.borderStrong,
      pressed: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      accent: c.text,
      onAccent: c.background,
      success: c.success,
      destructive: c.destructive,
    }),
    [c, isDark],
  );
}

// ─── Group ────────────────────────────────────────────────────

export function SettingsGroup({
  header,
  footer,
  children,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const headingVisible = useSettingsHeadingVisible();
  // Header text lines up with the row content inset, the way platform grouped
  // lists do, rather than with the card edge.
  const headerInset = m.headerInset;

  return (
    <View style={{ gap: 8 }}>
      {header && headingVisible ? (
        <Text
          style={{
            fontSize: m.headerSize,
            fontFamily: Fonts.sansMedium,
            color: p.textSecondary,
            paddingHorizontal: headerInset,
          }}
        >
          {header}
        </Text>
      ) : null}
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
      {footer ? (
        <Text
          style={{
            fontSize: m.descSize,
            fontFamily: Fonts.sans,
            color: p.textTertiary,
            paddingHorizontal: headerInset,
          }}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Icon tile ────────────────────────────────────────────────

/**
 * Monochrome icon tile. Deliberately not the colourful iOS-Settings tile —
 * the rest of AiJee is greyscale + hairline borders, and saturated tiles here
 * would read as a different product.
 */
export const SettingsIconTile = memo(function SettingsIconTile({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tone?: 'default' | 'destructive';
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = tone === 'destructive' ? p.destructive : p.textSecondary;

  return (
    <View
      style={{
        width: m.tileSize,
        height: m.tileSize,
        borderRadius: m.tileRadius,
        backgroundColor: p.tile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={m.tileIcon} color={color} strokeWidth={1.8} />
    </View>
  );
});

// ─── Row ──────────────────────────────────────────────────────

export function SettingsRow({
  icon,
  label,
  description,
  right,
  onPress,
  isLast,
  tone,
  accessibilityLabel,
}: {
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  description?: string;
  right?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  tone?: 'default' | 'destructive';
  accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const destructive = tone === 'destructive';

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: m.gutter,
        paddingVertical: m.rowPaddingV,
        minHeight: m.rowMinHeight,
      }}
    >
      {icon ? <SettingsIconTile icon={icon} tone={tone} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontSize: m.labelSize,
            fontFamily: Fonts.sans,
            color: destructive ? p.destructive : p.text,
          }}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              fontSize: m.descSize,
              fontFamily: Fonts.sans,
              color: p.textTertiary,
              lineHeight: m.descSize * 1.35,
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  // iOS-style separator inset: starts after the icon tile so the list reads as
  // a column of items rather than a stack of full-width bars.
  const separatorInset = icon ? m.gutter + m.tileSize + 12 : m.gutter;

  return (
    <View>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          style={({ pressed }) => (pressed ? { backgroundColor: p.pressed } : undefined)}
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
      {!isLast ? (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: p.separator,
            marginLeft: separatorInset,
          }}
        />
      ) : null}
    </View>
  );
}

// ─── Switch ───────────────────────────────────────────────────

export function SettingsSwitch({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  const control = (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{
        false: p.isDark ? '#3A3A3C' : '#E4E4E7',
        true: p.success,
      }}
      // iOS renders the thumb itself; Android/web need it spelled out.
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
    />
  );

  if (m.switchScale === 1) return control;
  return <View style={{ transform: [{ scale: m.switchScale }] }}>{control}</View>;
}

// ─── Screen shell ─────────────────────────────────────────────

/** Content-container style for the settings ScrollView. */
export function useSettingsContentStyle(bottomInset: number) {
  const m = useSettingsMetrics();
  return useMemo(
    () => ({
      paddingHorizontal: m.gutter,
      paddingTop: m.gutter / 2,
      paddingBottom: bottomInset + 32,
      gap: m.groupGap,
      width: '100%' as const,
      maxWidth: m.contentMaxWidth,
      alignSelf: 'center' as const,
    }),
    [bottomInset, m],
  );
}
