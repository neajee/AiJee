import { createFileRoute } from "@tanstack/react-router";
import { useRouter } from '@/hooks/router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SettingsIndexScreen } from '@/features/settings/components/settings-screens';
function SettingsScreen() {
  const router = useRouter();
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  return <SettingsIndexScreen isDark={isDark} onOpenSection={section => router.push(`/settings/${section.slug}`)} />;
}
export const Route = createFileRoute("/_app/settings/")({
  component: SettingsScreen
});
