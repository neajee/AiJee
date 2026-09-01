import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useAppSettingsStore } from '@/features/settings/store';

export function useColorScheme() {
  const systemScheme = useSystemColorScheme();
  const themeMode = useAppSettingsStore((s) => s.themeMode);
  // Subscribe legacy Colors consumers to preset changes while they migrate.
  useAppSettingsStore((s) => `${s.themePreset}:${s.accentPreset}`);

  if (themeMode === 'system') {
    return systemScheme;
  }
  return themeMode;
}
