import { useCallback } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsDetailScreen } from '@/features/settings/components/settings-screens';
import { findSettingsSection } from '@/features/settings/sections';

export default function SettingsSectionScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { section: slug } = useLocalSearchParams<{ section: string }>();
  const section = findSettingsSection(slug);

  const handleBack = useCallback(() => {
    // Deep links land here with no history, so fall back to the index.
    if (router.canGoBack()) router.back();
    else router.navigate('/settings');
  }, [router]);

  if (!section) return <Redirect href="/settings" />;

  return <SettingsDetailScreen section={section} isDark={isDark} onBack={handleBack} />;
}
