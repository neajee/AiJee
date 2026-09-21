import { usePathname, useRouter } from "@/hooks/router";
import { ChevronLeft } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useWorkspaceStore } from "@/features/workspace/store";
import { SETTINGS_SECTIONS } from "@/features/settings/sections";
import { SidebarHeader } from "../sidebar-header";
import { SidebarRow } from "./navigation-rows";
export function SettingsSidebar() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const selectedWorkspaceId = useWorkspaceStore(s => s.selectedWorkspaceId);
  const activeSlug = pathname.match(/^\/settings\/([^/]+)/)?.[1] ?? SETTINGS_SECTIONS[0]?.slug;
  const handleBack = () => router.replace(selectedWorkspaceId ? `/workspace/${selectedWorkspaceId}` : "/");
  return <div className="flex h-full w-full flex-col overflow-y-auto bg-background text-body">
      <div className="shrink-0 border-b border-border"><SidebarHeader /></div>
      <div className="flex shrink-0 flex-col px-2 pt-2"><SidebarRow icon={<ChevronLeft size={15} color={colors.textSecondary} strokeWidth={1.8} />} label="返回" onClick={handleBack} isDark={isDark} /></div>
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 pt-1">
        {SETTINGS_SECTIONS.map(section => {
        const Icon = section.icon;
        return <SidebarRow key={section.slug} icon={<Icon size={15} color={section.slug === activeSlug ? colors.text : colors.textSecondary} strokeWidth={1.8} />} label={section.title} isActive={section.slug === activeSlug} onClick={() => router.push(`/settings/${section.slug}` as any)} isDark={isDark} />;
      })}
      </div>
    </div>;
}
