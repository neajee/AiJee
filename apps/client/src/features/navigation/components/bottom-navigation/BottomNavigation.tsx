import MaterialIcons from '@/platform/icons';
import { useRouter, usePathname } from '@/hooks/router';
import { useSafeAreaInsets } from "@/platform/browser";
import { Colors, WorkspaceColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useWorkspaceStore } from '@/features/workspace/store';
import { WorkspaceAvatar } from '../workspace-avatar';
import { AddWorkspaceButton } from '../add-workspace-button';
export function BottomNavigation() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const workspaces = useWorkspaceStore(s => s.workspaces);
  const selectedWorkspaceId = useWorkspaceStore(s => s.selectedWorkspaceId);
  const selectWorkspace = useWorkspaceStore(s => s.selectWorkspace);
  const addWorkspace = useWorkspaceStore(s => s.addWorkspace);
  const isSettingsActive = pathname.startsWith('/settings');
  const handleWorkspacePress = (id: string) => {
    selectWorkspace(id);
    router.replace(`/workspace/${id}`);
  };
  const handleAddWorkspace = () => {
    addWorkspace({
      title: `Project ${workspaces.length + 1}`,
      path: '~/work/project-' + (workspaces.length + 1),
      color: WorkspaceColors[workspaces.length % WorkspaceColors.length]
    });
  };
  return <div className={"  bg-background pb-[var(--bottom-inset)]"}>
      <div horizontal className="flex flex-col">
        {workspaces.map(ws => <WorkspaceAvatar key={ws.id} title={ws.title} color={ws.color} isActive={ws.id === selectedWorkspaceId} hasNotification={ws.hasNotifications} onClick={() => handleWorkspacePress(ws.id)} layout="horizontal" />)}
        <AddWorkspaceButton onClick={handleAddWorkspace} layout="horizontal" />
      </div>

      <div className={"  bg-muted"} />

      <div className="flex flex-col">
        <BottomBarIcon icon="settings" isActive={isSettingsActive} onClick={() => router.push('/settings')} />
      </div>
    </div>;
}
function BottomBarIcon({
  icon,
  isActive,
  onPress
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  isActive: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  return <button onClick={onPress}>
      <MaterialIcons name={icon} size={22} color={isActive ? colors.text : colors.icon} />
    </button>;
}
const styles = {
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 6
  },
  workspaceScroll: {
    flex: 1
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingLeft: 8,
    paddingRight: 8
  },
  dividerVertical: {
    width: 1,
    height: 28,
    marginLeft: 4,
    marginRight: 4
  },
  fixedItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingRight: 12
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  }
} as const;
