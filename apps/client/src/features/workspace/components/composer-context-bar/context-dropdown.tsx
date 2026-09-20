import type { ReactNode } from 'react';
import { Animated } from "@/styles/motion";
import { Check, ChevronDown, FolderGit2, GitBranch, Globe, Plus } from 'lucide-react';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import type { GitBranch as GitBranchInfo } from '@aijee/client-sdk';
import type { Server } from '@/features/servers/store';
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
  const renderControl = (kind: Exclude<DropdownKind, null>, icon: ReactNode, label: string, labelText: string, disabled = false) => <button onClick={() => onToggle(kind)} disabled={disabled} role="button" aria-label={labelText}>
      {icon}<span className={"  text-text-secondary"}>{label}</span>
      {!disabled && <ChevronDown size={12} color={theme.textMuted} strokeWidth={1.8} />}
    </button>;
  return <div className={"block"}>
      <div className={"block"}>
        {renderControl('project', <FolderGit2 size={13} color={theme.textMuted} strokeWidth={1.8} />, workspaces.find(w => w.id === selectedWorkspaceId)?.title ?? 'Project', 'Project: change project.')}
        {open === 'project' && <div role="menu" aria-label="Project selection" className={"block"}>
          <div className={"block"}>
            {workspaces.map(workspace => {
            const active = workspace.id === selectedWorkspaceId;
            return <button key={workspace.id} onClick={() => onSelectProject(workspace.id)} role="menuitem">
                <div className={"block"}><div className={"  bg-background"} /><span>{workspace.title}</span></div>
                {active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
          <button onClick={onAddWorkspace} role="menuitem" aria-label="添加新项目">
            <Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><span className={"  text-text-secondary"}>添加新项目</span>
          </button>
        </div>}
      </div>
      <div className={"block"}>
        {renderControl('environment', <Globe size={13} color={theme.textMuted} strokeWidth={1.8} />, activeServer?.name ?? 'Local', `Environment: ${activeServer?.name ?? 'Local'}. Press to change.`, servers.length === 0)}
        {open === 'environment' && <div role="menu" aria-label="Environment selection" className={"block"}>
          <div className={"block"}>
            {servers.map(server => {
            const active = server.id === activeServerId;
            return <button key={server.id} onClick={() => void onSelectServer(server)} role="menuitem">
                <div className={"block"}><Globe size={13} color={active ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><div className={"block"}><span>{server.name}</span><span className={"  text-text-secondary"}>{server.address}</span></div></div>
                {busy === server.id ? <span className="size-3 animate-spin" /> : active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
        </div>}
      </div>
      {isGitRepo && <div className={"block"}>
        {renderControl('branch', <GitBranch size={13} color={theme.textMuted} strokeWidth={1.8} />, currentBranch ?? '—', `Branch: ${currentBranch ?? 'unknown'}. Press to change.`)}
        {open === 'branch' && <div role="menu" aria-label="Branch selection" className={"block"}>
          {branchesLoading && !branches ? <div className={"block"}><span className="size-3 animate-spin" /></div> : localBranches.length === 0 ? <span className={"  text-text-secondary"}>No branches found</span> : <><div className={"block"}>{localBranches.map(branch => <button key={branch.name} onClick={() => void onSelectBranch(branch)} role="menuitem"><div className={"block"}><GitBranch size={13} color={branch.is_current ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><span>{branch.name}</span></div>{busy === branch.name ? <span className="size-3 animate-spin" /> : branch.is_current && <Check size={13} color={theme.accentColor} strokeWidth={2} />}</button>)}</div><button onClick={onAddBranch}><Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><span className={"  text-text-secondary"}>新建分支</span></button></>}</div>}
      </div>}
    </div>;
}
