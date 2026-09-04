import { ScrollView, Spinner, Text, View } from 'tamagui';
import type { ReactNode } from 'react';
import { Animated, Pressable } from 'react-native';
import { Check, ChevronDown, FolderGit2, GitBranch, Globe, Plus } from 'lucide-react-native';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import type { GitBranch as GitBranchInfo } from '@aijee/client-sdk';
import type { Server } from '@/features/servers/store';
import { styles } from '../../utils/composer-context-bar-styles';
import type { DropdownKind } from './types';

type PromptTheme = ReturnType<typeof usePromptTheme>;

interface ContextDropdownProps {
  theme: PromptTheme;
  open: DropdownKind;
  anim: Animated.Value;
  branches: GitBranchInfo[] | null;
  branchesLoading: boolean;
  busy: string | null;
  workspaces: Array<{ id: string; title: string; color: string }>;
  selectedWorkspaceId: string | null;
  activeServer: Server | null;
  servers: Server[];
  activeServerId: string | null;
  currentBranch: string | null;
  isGitRepo: boolean;
  localBranches: GitBranchInfo[];
  onToggle: (kind: Exclude<DropdownKind, null>) => void;
  onSelectProject: (id: string) => void;
  onSelectServer: (server: Server) => void;
  onSelectBranch: (branch: GitBranchInfo) => void;
  onAddWorkspace: () => void;
  onAddBranch: () => void;
}

export function ContextDropdown({
  theme, open, anim, branches, branchesLoading, busy, workspaces,
  selectedWorkspaceId, activeServer, servers, activeServerId, currentBranch,
  isGitRepo, localBranches, onToggle, onSelectProject, onSelectServer,
  onSelectBranch, onAddWorkspace, onAddBranch,
}: ContextDropdownProps) {
  if (!isGitRepo && open === 'branch') return null;
  const popoverStyle = [styles.popover, { backgroundColor: theme.dropdownBg, borderColor: theme.dropdownBorder, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }];
  const renderControl = (kind: Exclude<DropdownKind, null>, icon: ReactNode, label: string, labelText: string, disabled = false) => (
    <Pressable onPress={() => onToggle(kind)} disabled={disabled} accessibilityRole="button" accessibilityLabel={labelText} accessibilityState={{ expanded: open === kind, disabled }} style={({ pressed, hovered }: any) => [styles.control, (pressed || hovered) && !disabled && { backgroundColor: theme.hoverBg }, disabled && { opacity: 0.5 }]}>
      {icon}<Text style={[styles.controlText, { color: theme.textSecondary }]} numberOfLines={1}>{label}</Text>
      {!disabled && <ChevronDown size={12} color={theme.textMuted} strokeWidth={1.8} />}
    </Pressable>
  );
  return (
    <View style={styles.bar}>
      <View style={styles.anchor}>
        {renderControl('project', <FolderGit2 size={13} color={theme.textMuted} strokeWidth={1.8} />, workspaces.find((w) => w.id === selectedWorkspaceId)?.title ?? 'Project', 'Project: change project.')}
        {open === 'project' && <Animated.View accessibilityRole="menu" accessibilityLabel="Project selection" style={popoverStyle}>
          <ScrollView style={styles.popoverScroll} showsVerticalScrollIndicator={false}>
            {workspaces.map((workspace) => {
              const active = workspace.id === selectedWorkspaceId;
              return <Pressable key={workspace.id} onPress={() => onSelectProject(workspace.id)} accessibilityRole="menuitem" accessibilityState={{ selected: active }} style={({ pressed, hovered }: any) => [styles.item, (pressed || hovered) && { backgroundColor: theme.hoverBg }]}>
                <View style={styles.itemMain}><View style={[styles.colorDot, { backgroundColor: workspace.color }]} /><Text style={[styles.itemText, { color: active ? theme.accentColor : theme.textPrimary }]} numberOfLines={1}>{workspace.title}</Text></View>
                {active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </Pressable>;
            })}
          </ScrollView>
          <Pressable onPress={onAddWorkspace} accessibilityRole="menuitem" accessibilityLabel="添加新项目" style={({ pressed, hovered }: any) => [styles.addProject, { borderTopColor: theme.dropdownBorder }, (pressed || hovered) && { backgroundColor: theme.hoverBg }]}>
            <Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><Text style={[styles.addProjectText, { color: theme.textSecondary }]}>添加新项目</Text>
          </Pressable>
        </Animated.View>}
      </View>
      <View style={styles.anchor}>
        {renderControl('environment', <Globe size={13} color={theme.textMuted} strokeWidth={1.8} />, activeServer?.name ?? 'Local', `Environment: ${activeServer?.name ?? 'Local'}. Press to change.`, servers.length === 0)}
        {open === 'environment' && <Animated.View accessibilityRole="menu" accessibilityLabel="Environment selection" style={popoverStyle}>
          <ScrollView style={styles.popoverScroll} showsVerticalScrollIndicator={false}>
            {servers.map((server) => {
              const active = server.id === activeServerId;
              return <Pressable key={server.id} onPress={() => void onSelectServer(server)} accessibilityRole="menuitem" accessibilityState={{ selected: active }} style={({ pressed, hovered }: any) => [styles.item, (pressed || hovered) && { backgroundColor: theme.hoverBg }]}>
                <View style={styles.itemMain}><Globe size={13} color={active ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><View style={styles.itemLabels}><Text style={[styles.itemText, { color: active ? theme.accentColor : theme.textPrimary }]} numberOfLines={1}>{server.name}</Text><Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>{server.address}</Text></View></View>
                {busy === server.id ? <Spinner size="small" color={theme.textMuted} /> : active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </Pressable>;
            })}
          </ScrollView>
        </Animated.View>}
      </View>
      {isGitRepo && <View style={styles.anchor}>
        {renderControl('branch', <GitBranch size={13} color={theme.textMuted} strokeWidth={1.8} />, currentBranch ?? '—', `Branch: ${currentBranch ?? 'unknown'}. Press to change.`)}
        {open === 'branch' && <Animated.View accessibilityRole="menu" accessibilityLabel="Branch selection" style={popoverStyle}>
          {branchesLoading && !branches ? <View style={styles.loadingRow}><Spinner size="small" color={theme.textMuted} /></View> : localBranches.length === 0 ? <Text style={[styles.emptyText, { color: theme.textMuted }]}>No branches found</Text> : <><ScrollView style={styles.popoverScroll} showsVerticalScrollIndicator={false}>{localBranches.map((branch) => <Pressable key={branch.name} onPress={() => void onSelectBranch(branch)} accessibilityRole="menuitem" accessibilityState={{ selected: branch.is_current }} style={({ pressed, hovered }: any) => [styles.item, (pressed || hovered) && { backgroundColor: theme.hoverBg }]}><View style={styles.itemMain}><GitBranch size={13} color={branch.is_current ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><Text style={[styles.itemText, { color: branch.is_current ? theme.accentColor : theme.textPrimary }]} numberOfLines={1}>{branch.name}</Text></View>{busy === branch.name ? <Spinner size="small" color={theme.textMuted} /> : branch.is_current && <Check size={13} color={theme.accentColor} strokeWidth={2} />}</Pressable>)}</ScrollView><Pressable onPress={onAddBranch} style={({ pressed, hovered }: any) => [styles.createBranchAction, { borderTopColor: theme.dropdownBorder }, (pressed || hovered) && { backgroundColor: theme.hoverBg }]}><Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><Text style={[styles.createBranchText, { color: theme.textSecondary }]}>新建分支</Text></Pressable></>}</Animated.View>}
      </View>}
    </View>
  );
}
