import { useCallback } from 'react';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsDetailScreen } from '@/features/settings/components/settings-screens';
import { findSettingsSection } from '@/features/settings/sections';
import { useWorkspaceStore } from '@/features/workspace/store';

export default function SettingsSectionScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const { section: slug } = useLocalSearchParams<{ section: string }>();
  const section = findSettingsSection(slug);
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);

  const handleBack = useCallback(() => {
    if (selectedWorkspaceId) {
      router.replace(`/workspace/${selectedWorkspaceId}`);
      return;
    }
    router.replace('/');
  }, [router, selectedWorkspaceId]);

  if (!section) return <Redirect href="/settings" />;

  return <SettingsDetailScreen section={section} isDark={isDark} onBack={handleBack} />;
}
