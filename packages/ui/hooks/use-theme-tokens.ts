import { useMemo } from 'react';

import { getThemeTokens, syncLegacyColors, type ThemeTokens } from '@/constants/theme';
import { useAppSettingsStore } from '@/features/settings/store';
import { useColorScheme } from './use-color-scheme';

export function useThemeTokens(): ThemeTokens {
  const scheme = useColorScheme() ?? 'light';
  const preset = useAppSettingsStore((s) => s.themePreset);
  const accent = useAppSettingsStore((s) => s.accentPreset);
  return useMemo(() => {
    syncLegacyColors(preset, scheme, accent);
    return getThemeTokens(preset, scheme, accent);
  }, [accent, preset, scheme]);
}
