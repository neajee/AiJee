import { Platform } from 'react-native';

import type { AccentPreset, ThemePreset } from '@/features/settings/store';
import { TAMAGUI_COLOR_TOKENS, TAMAGUI_DARK_COLOR_TOKENS } from './theme-static';

export type { AccentPreset, ThemePreset };

export interface ThemeTokens {
  text: string;
  textSecondary: string;
  textTertiary: string;
  background: string;
  surfaceRaised: string;
  surface: string;
  tint: string;
  icon: string;
  iconMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  onAccent: string;
  success: string;
  destructive: string;
  notificationDot: string;
  overlay: string;
  sheetBackground: string;
  sheetHandle: string;
  code: string;
  codeText: string;
  diffAdded: string;
  diffRemoved: string;
  skill: string;
  contrast: number;
  opaqueWindows: boolean;
  uiFont: string;
  codeFont: string;
}

const ACCENTS: Record<AccentPreset, { light: string; dark: string }> = {
  blue: { light: '#2563EB', dark: '#60A5FA' },
  violet: { light: '#7C3AED', dark: '#A78BFA' },
  teal: { light: '#0F766E', dark: '#5EEAD4' },
  orange: { light: '#C2410C', dark: '#FDBA74' },
  pink: { light: '#BE185D', dark: '#F9A8D4' },
  green: { light: '#15803D', dark: '#86EFAC' },
};

const PRESET_COLORS: Record<ThemePreset, { light: Partial<ThemeTokens>; dark: Partial<ThemeTokens> }> = {
  radix: {
    light: TAMAGUI_COLOR_TOKENS,
    dark: TAMAGUI_DARK_COLOR_TOKENS,
  },
  codex: {
    light: { background: '#FFFFFF', surfaceRaised: '#F5F5F5', surface: '#FFFFFF', text: '#1A1C1F', textSecondary: '#5F6368', textTertiary: '#7A8087', code: '#F5F5F5', codeText: '#1A1C1F' },
    dark: { background: '#181818', surfaceRaised: '#222222', surface: '#252525', text: '#FFFFFF', textSecondary: '#B8B8B8', textTertiary: '#858585', code: '#121212', codeText: '#F3F3F3' },
  },
  vercel: {
    light: { background: '#FFFFFF', surfaceRaised: '#F5F5F5', surface: '#FFFFFF', text: '#171717', textSecondary: '#666666', textTertiary: '#888888', code: '#F5F5F5', codeText: '#171717' },
    dark: { background: '#000000', surfaceRaised: '#111111', surface: '#181818', text: '#EDEDED', textSecondary: '#A1A1A1', textTertiary: '#666666', code: '#111111', codeText: '#EDEDED' },
  },
};

export function getThemeTokens(preset: ThemePreset, scheme: 'light' | 'dark', accent: AccentPreset = 'blue'): ThemeTokens {
  const base = scheme === 'dark' ? Colors.dark : Colors.light;
  const overrides = PRESET_COLORS[preset]?.[scheme] ?? {};
  const accentColor = preset === 'codex' ? '#3A83F7' : preset === 'vercel' ? (scheme === 'dark' ? '#006EFE' : '#006AFF') : ACCENTS[accent]?.[scheme] ?? ACCENTS.blue[scheme];
  const isCodex = preset === 'codex';
  const isVercel = preset === 'vercel';
  const semantic = isCodex
    ? { diffAdded: scheme === 'dark' ? '#40C977' : '#00A240', diffRemoved: scheme === 'dark' ? '#FA423E' : '#BA2623', skill: scheme === 'dark' ? '#AD7BF9' : '#924FF7', contrast: scheme === 'dark' ? 60 : 45, opaqueWindows: true }
    : isVercel
      ? { diffAdded: scheme === 'dark' ? '#00AD3A' : '#28A948', diffRemoved: scheme === 'dark' ? '#F13342' : '#EB001D', skill: scheme === 'dark' ? '#9540D5' : '#A100F8', contrast: scheme === 'dark' ? 50 : 40, opaqueWindows: true }
    : { diffAdded: scheme === 'dark' ? '#3FB950' : '#1A7F37', diffRemoved: scheme === 'dark' ? '#F85149' : '#CF222E', skill: accentColor, contrast: scheme === 'dark' ? 60 : 45, opaqueWindows: true };
  return { ...base, ...overrides, tint: accentColor, accent: isCodex ? '#3A83F7' : isVercel ? (scheme === 'dark' ? '#006EFE' : '#006AFF') : accentColor, onAccent: scheme === 'dark' ? '#111111' : '#FFFFFF', overlay: base.overlay, sheetBackground: base.sheetBackground, sheetHandle: base.sheetHandle, code: overrides.code ?? base.surfaceRaised, codeText: overrides.codeText ?? base.text, uiFont: isVercel ? 'Geist, Inter, system-ui, sans-serif' : 'DM Sans, system-ui, sans-serif', codeFont: isVercel ? '"Geist Mono", ui-monospace, "SFMono-Regular", monospace' : '"JetBrains Mono", ui-monospace, monospace', ...semantic };
}

export const Colors = {
  light: {
    ...TAMAGUI_COLOR_TOKENS,
    activeIndicator: TAMAGUI_COLOR_TOKENS.tint,
    tabIconDefault: TAMAGUI_COLOR_TOKENS.icon,
    tabIconSelected: TAMAGUI_COLOR_TOKENS.accent,
  },
  dark: {
    ...TAMAGUI_DARK_COLOR_TOKENS,
    activeIndicator: TAMAGUI_DARK_COLOR_TOKENS.tint,
    tabIconDefault: TAMAGUI_DARK_COLOR_TOKENS.icon,
    tabIconSelected: TAMAGUI_DARK_COLOR_TOKENS.accent,
  },
};

/** Keeps legacy direct Colors.light/dark consumers in sync during migration. */
export function syncLegacyColors(preset: ThemePreset, scheme: 'light' | 'dark', accent: AccentPreset): void {
  const target = Colors[scheme];
  const overrides = PRESET_COLORS[preset]?.[scheme] ?? {};
  const accentColor = preset === 'codex' ? '#3A83F7' : preset === 'vercel' ? (scheme === 'dark' ? '#006EFE' : '#006AFF') : ACCENTS[accent]?.[scheme] ?? ACCENTS.blue[scheme];
  Object.assign(target, overrides, {
    tint: accentColor,
    activeIndicator: accentColor,
    tabIconSelected: accentColor,
  });
}

export const WorkspaceColors = [
  '#7B8EC8',
  '#6BA3A0',
  '#C49B7A',
  '#7DAA8B',
  '#A48BBF',
  '#BF8A9E',
  '#8E9B82',
  '#B5A07A',
];

export const Fonts = Platform.select({
  ios: {
    sans: 'DMSans-Regular',
    sansItalic: 'DMSans-Regular',
    sansMedium: 'DMSans-Medium',
    sansMediumItalic: 'DMSans-Medium',
    sansSemiBold: 'DMSans-Bold',
    sansBold: 'DMSans-Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'monospace',
  },
  default: {
    sans: 'DMSans-Regular',
    sansItalic: 'DMSans-Regular',
    sansMedium: 'DMSans-Medium',
    sansMediumItalic: 'DMSans-Medium',
    sansSemiBold: 'DMSans-Bold',
    sansBold: 'DMSans-Bold',
    serif: 'serif',
    rounded: 'DMSans-Regular',
    mono: 'monospace',
  },
  web: {
    sans: "'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    sansItalic: "'DM Sans', system-ui, sans-serif",
    sansMedium: "'DM Sans', system-ui, sans-serif",
    sansMediumItalic: "'DM Sans', system-ui, sans-serif",
    sansSemiBold: "'DM Sans', system-ui, sans-serif",
    sansBold: "'DM Sans', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'DM Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
});
