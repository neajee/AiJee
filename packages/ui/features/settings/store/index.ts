import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'app_settings';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePreset = 'radix' | 'codex' | 'vercel';
export type AccentPreset = 'blue' | 'violet' | 'teal' | 'orange' | 'pink' | 'green';
interface AppSettings {
  themeMode: ThemeMode;
  themePreset: ThemePreset;
  accentPreset: AccentPreset;
  uiFontSize: number;
  codeFontSize: number;
  pushNotifications: boolean;
  soundEffects: boolean;
  /** Allow outbound update checks against GitHub Releases. */
  checkUpdates: boolean;
}

interface AppSettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  update: (settings: Partial<AppSettings>) => Promise<void>;
}

const DEFAULTS: AppSettings = {
  themeMode: 'system',
  themePreset: 'radix',
  accentPreset: 'blue',
  uiFontSize: 14,
  codeFontSize: 13,
  pushNotifications: true,
  soundEffects: false,
  checkUpdates: true,
};

const THEME_PRESETS = new Set<ThemePreset>(['radix', 'codex', 'vercel']);

async function readFromStore(): Promise<Partial<AppSettings>> {
  try {
    if (Platform.OS === 'web') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeToStore(settings: AppSettings) {
  try {
    const json = JSON.stringify(settings);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, json);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, json);
    }
  } catch {
    // silently fail
  }
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  ...DEFAULTS,
  loaded: false,

  load: async () => {
    const stored = await readFromStore();
    set({
      ...DEFAULTS,
      ...stored,
      themePreset: THEME_PRESETS.has(stored.themePreset as ThemePreset) ? stored.themePreset as ThemePreset : DEFAULTS.themePreset,
      loaded: true,
    });
  },

  update: async (partial) => {
    const current = get();
    const next: AppSettings = {
      themeMode: partial.themeMode ?? current.themeMode,
      themePreset: partial.themePreset ?? current.themePreset,
      accentPreset: partial.accentPreset ?? current.accentPreset,
      uiFontSize: partial.uiFontSize ?? current.uiFontSize,
      codeFontSize: partial.codeFontSize ?? current.codeFontSize,
      pushNotifications: partial.pushNotifications ?? current.pushNotifications,
      soundEffects: partial.soundEffects ?? current.soundEffects,
      checkUpdates: partial.checkUpdates ?? current.checkUpdates,
    };
    set(next);
    await writeToStore(next);
  },
}));
