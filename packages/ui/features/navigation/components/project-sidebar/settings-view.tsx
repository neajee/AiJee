import { ScrollView, Text, View } from 'tamagui';
import { usePathname, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useWorkspaceStore } from "@/features/workspace/store";
import { SETTINGS_SECTIONS } from "@/features/settings/sections";
import { SidebarHeader } from "../sidebar-header";
import { SidebarRow } from "./navigation-rows";
import { styles } from "./styles";

export function SettingsSidebar() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId);
  const activeSlug = pathname.match(/^\/settings\/([^/]+)/)?.[1] ?? SETTINGS_SECTIONS[0]?.slug;
  const handleBack = () => router.replace(selectedWorkspaceId ? `/workspace/${selectedWorkspaceId}` : "/");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.serverRow, { borderBottomColor: colors.border }]}><SidebarHeader /></View>
      <View style={styles.top}><SidebarRow icon={<ChevronLeft size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="返回" onPress={handleBack} isDark={isDark} /></View>
      <View style={styles.settingsHeader}><Text style={[styles.settingsTitle, { color: colors.text }]}>设置</Text></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return <SidebarRow key={section.slug} icon={<Icon size={15} color={section.slug === activeSlug ? colors.text : colors.textSecondary} strokeWidth={1.8} />} label={section.title} isActive={section.slug === activeSlug} onPress={() => router.push(`/settings/${section.slug}` as any)} isDark={isDark} />;
        })}
      </ScrollView>
    </View>
  );
}
