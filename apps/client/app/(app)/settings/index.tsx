import { useRouter } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsIndexScreen } from '@/features/settings/components/settings-screens';

export default function SettingsScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';

  return (
    <SettingsIndexScreen
      isDark={isDark}
      onOpenSection={(section) => router.push(`/settings/${section.slug}`)}
    />
  );
}
