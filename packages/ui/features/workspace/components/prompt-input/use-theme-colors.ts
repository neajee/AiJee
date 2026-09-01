import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export function usePromptTheme() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors,
    cardBg: colors.background,
    cardBorder: colors.borderStrong,
    toolbarBg: colors.surfaceRaised,
    toolbarBorder: colors.border,
    textPrimary: colors.text,
    textMuted: colors.textTertiary,
    textSecondary: colors.textSecondary,
    dropdownBg: colors.surface,
    dropdownBorder: colors.border,
    hoverBg: colors.surfaceRaised,
    selectedBg: colors.surface,
    sectionColor: colors.textTertiary,
    accentColor: colors.accent,
  };
}
