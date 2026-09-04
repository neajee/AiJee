import { useEffect, type ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { Fonts, type AccentPreset, type ThemePreset } from "@/constants/theme";
import { useAppSettingsStore, type ThemeMode } from "../store";
import { SettingsGroup, SettingsRow, useSettingsMetrics, useSettingsPhoneLayout, useSettingsPalette } from "@/components/settings-surface";
import { Select } from "@/components/ui/select";
import { pickerStyles } from "../utils/appearance-styles";
const THEMES: {
  key: ThemeMode;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
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
            compact
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
            compact
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
  themeSelect: { width: 120, maxWidth: '100%' },
  accentSelect: { width: 120, maxWidth: '100%' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, overflow: 'hidden' },
  stepButton: { width: 28, height: 26, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { width: 44, textAlign: 'center', fontFamily: Fonts.mono, fontSize: 11 },
});
