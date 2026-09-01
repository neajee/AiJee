import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

export function useChangesTheme() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colors,
    surfaceBg: colors.background,
    dividerColor: colors.border,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    textMuted: colors.textTertiary,
    hoverBg: colors.surfaceRaised,
    inputBg: colors.surfaceRaised,
    inputBorder: colors.border,
    sendColor: colors.accent,
    hashColor: colors.textTertiary,
  };
}
