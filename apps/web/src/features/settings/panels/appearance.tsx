import { useEffect, type ComponentType } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { type AccentPreset, type ThemePreset } from "@/constants/theme";
import { useAppSettingsStore, type ThemeMode } from "../store";
import { SettingsGroup, SettingsRow, useSettingsMetrics, useSettingsPalette } from "@/components/settings-surface";
import { Select } from "@/components/ui/select";
const THEMES: {
  key: ThemeMode;
  icon: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  label: string;
}[] = [{
  key: 'light',
  icon: Sun,
  label: '浅色'
}, {
  key: 'dark',
  icon: Moon,
  label: '深色'
}, {
  key: 'system',
  icon: Monitor,
  label: '跟随系统'
}];
const PRESETS: Array<{
  key: ThemePreset;
  label: string;
  description: string;
}> = [{
  key: 'radix',
  label: 'Radix',
  description: '克制、清晰的产品灰阶'
}, {
  key: 'codex',
  label: 'Codex',
  description: 'ChatGPT 风格深色主题'
}, {
  key: 'vercel',
  label: 'Vercel',
  description: '黑白高对比开发者主题'
}];
const ACCENTS: Array<{
  key: AccentPreset;
  label: string;
  color: string;
}> = [{
  key: 'blue',
  label: '蓝',
  color: '#2563EB'
}, {
  key: 'violet',
  label: '紫',
  color: '#7C3AED'
}, {
  key: 'teal',
  label: '青',
  color: '#0F766E'
}, {
  key: 'orange',
  label: '橙',
  color: '#C2410C'
}, {
  key: 'pink',
  label: '粉',
  color: '#BE185D'
}, {
  key: 'green',
  label: '绿',
  color: '#15803D'
}];
function themeEntry(mode: ThemeMode) {
  return THEMES.find(t => t.key === mode) ?? THEMES[2];
}

/** Icon-only theme picker. Tapping an icon applies it immediately. */
function ThemePicker({
  value,
  onChange,
  compact = false
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
  compact?: boolean;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-border p-0.5">
      {THEMES.map(({
      key,
      icon: Icon,
      label
    }) => {
      const active = value === key;
      return <button key={key} onClick={() => onChange(key)} role="button" aria-label={`主题：${label}`} className={`flex size-6 items-center justify-center rounded-[5px] ${active ? 'bg-active' : 'hover:bg-hover'}`}>
            <Icon size={m.tileIcon} color={active ? p.text : p.textTertiary} strokeWidth={active ? 2.2 : 1.8} />
            {!compact ? <span className="text-[var(--desc-size)] font-sans">{label}</span> : null}
          </button>;
    })}
    </div>;
}
function useThemeMode() {
  const {
    themeMode,
    loaded,
    load,
    update
  } = useAppSettingsStore();
  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);
  return {
    themeMode,
    update
  };
}

/**
 * Index-list row. Resolves inline: no chevron, no screen push — the icons are
 * the control.
 */
export function AppearanceRow({
  isLast
}: {
  isLast?: boolean;
}) {
  const {
    themeMode,
    update
  } = useThemeMode();
  const current = themeEntry(themeMode);
  return <SettingsRow icon={current.icon} label="外观" description={current.label} isLast={isLast} right={<ThemePicker value={themeMode} onChange={v => update({
    themeMode: v
  })} compact />} />;
}
export function AppearancePanel() {
  const {
    themeMode,
    update
  } = useThemeMode();
  const themePreset = useAppSettingsStore(s => s.themePreset);
  const accentPreset = useAppSettingsStore(s => s.accentPreset);
  const uiFontSize = useAppSettingsStore(s => s.uiFontSize);
  const codeFontSize = useAppSettingsStore(s => s.codeFontSize);
  return <SettingsGroup header="外观">
    <SettingsRow label="外观模式" right={<ThemePicker value={themeMode} onChange={value => update({
      themeMode: value
    })} compact />} />
      <SettingsRow label="主题预设" right={<Select value={themePreset} options={PRESETS.map(item => ({
      value: item.key,
      label: item.label
    }))} onChange={value => update({
      themePreset: value
    })} compact />} />
      <SettingsRow label="强调色" right={<Select value={accentPreset} options={ACCENTS.map(item => ({
      value: item.key,
      label: item.label
    }))} onChange={value => update({
      accentPreset: value
    })} compact />} />
      <SettingsRow label="UI 字号" right={<SizeStepper value={uiFontSize} onChange={value => update({
      uiFontSize: value
    })} min={12} max={18} />} />
      <SettingsRow label="代码字号" isLast right={<SizeStepper value={codeFontSize} onChange={value => update({
      codeFontSize: value
    })} min={11} max={18} />} />
    </SettingsGroup>;
}
function SizeStepper({
  value,
  onChange,
  min,
  max
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-border">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="减小字号" className="flex size-7 items-center justify-center text-text-secondary hover:bg-hover disabled:opacity-40"><span className="inline-block">−</span></button>
      <span className="w-11 text-center font-mono text-[var(--value-size)] text-foreground">{value}px</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="增大字号" className="flex size-7 items-center justify-center text-text-secondary hover:bg-hover disabled:opacity-40"><span className="inline-block">+</span></button>
    </div>;
}