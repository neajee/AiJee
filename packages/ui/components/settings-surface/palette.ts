import { useMemo } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export interface SettingsPalette {
  isDark: boolean;
  bg: string;
  card: string;
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
  notification: string;
  destructive: string;
}

export function useSettingsPalette(): SettingsPalette {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const c = useThemeTokens();
  return useMemo(() => ({
    isDark,
    bg: isDark ? c.background : c.surfaceRaised,
    card: isDark ? c.surfaceRaised : c.background,
    tile: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    text: c.text, textSecondary: c.textSecondary, textTertiary: c.textTertiary,
    separator: c.border, border: c.borderStrong,
    pressed: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    accent: c.accent, onAccent: c.onAccent, success: c.success,
    notification: c.notificationDot, destructive: c.destructive,
  }), [c, isDark]);
}
