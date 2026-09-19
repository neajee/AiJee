import { toTailwind } from "@/styles/to-tailwind";
import type { ReactNode } from 'react';
import { Animated } from "@/platform/animation";
import { Check, ChevronDown, FolderGit2, GitBranch, Globe, Plus } from 'lucide-react';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import type { GitBranch as GitBranchInfo } from '@aijee/client-sdk';
import type { Server } from '@/features/servers/store';
import { styles } from '../../utils/composer-context-bar-styles';
import type { DropdownKind } from './component-types';
type PromptTheme = ReturnType<typeof usePromptTheme>;
interface ContextDropdownProps {
  theme: PromptTheme;
  open: DropdownKind;
  anim: Animated.Value;
  branches: GitBranchInfo[] | null;
  branchesLoading: boolean;
  busy: string | null;
  workspaces: Array<{
    id: string;
    title: string;
    color: string;
  }>;
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
  theme,
  open,
  anim,
  branches,
  branchesLoading,
  busy,
  workspaces,
  selectedWorkspaceId,
  activeServer,
  servers,
  activeServerId,
  currentBranch,
  isGitRepo,
  localBranches,
  onToggle,
  onSelectProject,
  onSelectServer,
  onSelectBranch,
  onAddWorkspace,
  onAddBranch
}: ContextDropdownProps) {
  if (!isGitRepo && open === 'branch') return null;
  const popoverStyle = [styles.popover, {
    backgroundColor: theme.dropdownBg,
    borderColor: theme.dropdownBorder,
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 0]
      })
    }]
  }];
  const renderControl = (kind: Exclude<DropdownKind, null>, icon: ReactNode, label: string, labelText: string, disabled = false) => <button onClick={() => onToggle(kind)} disabled={disabled} role="button" aria-label={labelText} accessibilityState={{
    expanded: open === kind,
    disabled
  }}>
      {icon}<span className={toTailwind([styles.controlText, {
      color: theme.textSecondary
    }])}>{label}</span>
      {!disabled && <ChevronDown size={12} color={theme.textMuted} strokeWidth={1.8} />}
    </button>;
  return <div className={toTailwind(styles.bar)}>
      <div className={toTailwind(styles.anchor)}>
        {renderControl('project', <FolderGit2 size={13} color={theme.textMuted} strokeWidth={1.8} />, workspaces.find(w => w.id === selectedWorkspaceId)?.title ?? 'Project', 'Project: change project.')}
        {open === 'project' && <div role="menu" aria-label="Project selection" className={toTailwind(popoverStyle)}>
          <div className={toTailwind(styles.popoverScroll)}>
            {workspaces.map(workspace => {
            const active = workspace.id === selectedWorkspaceId;
            return <button key={workspace.id} onClick={() => onSelectProject(workspace.id)} role="menuitem" accessibilityState={{
              selected: active
            }}>
                <div className={toTailwind(styles.itemMain)}><div className={toTailwind([styles.colorDot, {
                  backgroundColor: workspace.color
                }])} /><span className={toTailwind([styles.itemText, {
                  color: active ? theme.accentColor : theme.textPrimary
                }])}>{workspace.title}</span></div>
                {active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
          <button onClick={onAddWorkspace} role="menuitem" aria-label="添加新项目">
            <Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><span className={toTailwind([styles.addProjectText, {
            color: theme.textSecondary
          }])}>添加新项目</span>
          </button>
        </div>}
      </div>
      <div className={toTailwind(styles.anchor)}>
        {renderControl('environment', <Globe size={13} color={theme.textMuted} strokeWidth={1.8} />, activeServer?.name ?? 'Local', `Environment: ${activeServer?.name ?? 'Local'}. Press to change.`, servers.length === 0)}
        {open === 'environment' && <div role="menu" aria-label="Environment selection" className={toTailwind(popoverStyle)}>
          <div className={toTailwind(styles.popoverScroll)}>
            {servers.map(server => {
            const active = server.id === activeServerId;
            return <button key={server.id} onClick={() => void onSelectServer(server)} role="menuitem" accessibilityState={{
              selected: active
            }}>
                <div className={toTailwind(styles.itemMain)}><Globe size={13} color={active ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><div className={toTailwind(styles.itemLabels)}><span className={toTailwind([styles.itemText, {
                    color: active ? theme.accentColor : theme.textPrimary
                  }])}>{server.name}</span><span className={toTailwind([styles.itemSub, {
                    color: theme.textMuted
                  }])}>{server.address}</span></div></div>
                {busy === server.id ? <span size="small" color={theme.textMuted} /> : active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
        </div>}
      </div>
      {isGitRepo && <div className={toTailwind(styles.anchor)}>
        {renderControl('branch', <GitBranch size={13} color={theme.textMuted} strokeWidth={1.8} />, currentBranch ?? '—', `Branch: ${currentBranch ?? 'unknown'}. Press to change.`)}
        {open === 'branch' && <div role="menu" aria-label="Branch selection" className={toTailwind(popoverStyle)}>
          {branchesLoading && !branches ? <div className={toTailwind(styles.loadingRow)}><span size="small" color={theme.textMuted} /></div> : localBranches.length === 0 ? <span className={toTailwind([styles.emptyText, {
          color: theme.textMuted
        }])}>No branches found</span> : <><div className={toTailwind(styles.popoverScroll)}>{localBranches.map(branch => <button key={branch.name} onClick={() => void onSelectBranch(branch)} role="menuitem" accessibilityState={{
              selected: branch.is_current
            }}><div className={toTailwind(styles.itemMain)}><GitBranch size={13} color={branch.is_current ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><span className={toTailwind([styles.itemText, {
                  color: branch.is_current ? theme.accentColor : theme.textPrimary
                }])}>{branch.name}</span></div>{busy === branch.name ? <span size="small" color={theme.textMuted} /> : branch.is_current && <Check size={13} color={theme.accentColor} strokeWidth={2} />}</button>)}</div><button onClick={onAddBranch}><Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><span className={toTailwind([styles.createBranchText, {
              color: theme.textSecondary
            }])}>新建分支</span></button></>}</div>}
      </div>}
    </div>;
}
