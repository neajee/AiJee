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
  const renderControl = (kind: Exclude<DropdownKind, null>, icon: ReactNode, label: string, labelText: string, disabled = false) => <button className="flex h-7 min-w-0 items-center gap-1.5 rounded-md px-2 text-caption text-text-secondary hover:bg-hover disabled:opacity-40" onClick={() => onToggle(kind)} disabled={disabled} role="button" aria-label={labelText}>
      <span className="shrink-0">{icon}</span><span className="min-w-0 flex-1 truncate">{label}</span>
      {!disabled && <ChevronDown className="shrink-0" size={12} color={theme.textMuted} strokeWidth={1.8} />}
    </button>;
  return <div className="flex min-w-0 items-center gap-1">
      <div className="relative min-w-0">
        {renderControl('project', <FolderGit2 size={13} color={theme.textMuted} strokeWidth={1.8} />, workspaces.find(w => w.id === selectedWorkspaceId)?.title ?? 'Project', 'Project: change project.')}
        {open === 'project' && <div role="menu" aria-label="Project selection" className="absolute bottom-full left-0 z-50 mb-1 min-w-40 rounded-md border border-border bg-card p-1 shadow-xl">
          <div className="flex flex-col">
            {workspaces.map(workspace => {
            const active = workspace.id === selectedWorkspaceId;
            return <button className="flex h-7 w-full items-center justify-between gap-1.5 rounded px-1.5 text-left text-caption hover:bg-hover" key={workspace.id} onClick={() => onSelectProject(workspace.id)} role="menuitem">
                <span className="truncate">{workspace.title}</span>
                {active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
          <button className="flex h-7 w-full items-center gap-1.5 rounded px-1.5 text-left text-caption text-text-secondary hover:bg-hover" onClick={onAddWorkspace} role="menuitem" aria-label="添加新项目">
            <Plus size={13} color={theme.textMuted} strokeWidth={1.8} /><span className={"  text-text-secondary"}>添加新项目</span>
          </button>
        </div>}
      </div>
      <div className="relative min-w-0">
        {renderControl('environment', <Globe size={13} color={theme.textMuted} strokeWidth={1.8} />, activeServer?.name ?? 'Local', `Environment: ${activeServer?.name ?? 'Local'}. Press to change.`, servers.length === 0)}
        {open === 'environment' && <div role="menu" aria-label="Environment selection" className="absolute bottom-full left-0 z-50 mb-1 min-w-44 rounded-md border border-border bg-card p-1 shadow-xl">
          <div className="flex flex-col">
            {servers.map(server => {
            const active = server.id === activeServerId;
            return <button className="flex min-h-8 w-full items-center justify-between gap-1.5 rounded px-1.5 text-left hover:bg-hover" key={server.id} onClick={() => void onSelectServer(server)} role="menuitem">
                <span className="flex min-w-0 items-center gap-1.5"><Globe size={12} color={active ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><span className="flex min-w-0 flex-col"><span className="truncate text-caption">{server.name}</span><span className="truncate text-meta text-text-secondary">{server.address}</span></span></span>
                {busy === server.id ? <span className="size-3 animate-spin" /> : active && <Check size={13} color={theme.accentColor} strokeWidth={2} />}
              </button>;
          })}
          </div>
        </div>}
      </div>
      {isGitRepo && <div className="relative min-w-0">
        {renderControl('branch', <GitBranch size={13} color={theme.textMuted} strokeWidth={1.8} />, currentBranch ?? '—', `Branch: ${currentBranch ?? 'unknown'}. Press to change.`)}
        {open === 'branch' && <div role="menu" aria-label="Branch selection" className="absolute bottom-full left-0 z-50 mb-1 min-w-40 rounded-md border border-border bg-card p-1 shadow-xl">
          {branchesLoading && !branches ? <div className="flex p-2"><span className="size-3 animate-spin" /></div> : localBranches.length === 0 ? <span className="block px-1.5 py-2 text-caption text-text-secondary">No branches found</span> : <><div className="flex flex-col">{localBranches.map(branch => <button className="flex h-7 w-full items-center justify-between gap-1.5 rounded px-1.5 text-left text-caption hover:bg-hover" key={branch.name} onClick={() => void onSelectBranch(branch)} role="menuitem"><span className="flex items-center gap-1.5"><GitBranch size={12} color={branch.is_current ? theme.accentColor : theme.textMuted} strokeWidth={1.8} /><span>{branch.name}</span></span>{busy === branch.name ? <span className="size-3 animate-spin" /> : branch.is_current && <Check size={12} color={theme.accentColor} strokeWidth={2} />}</button>)}</div><button className="flex h-7 w-full items-center gap-1.5 rounded px-1.5 text-left text-caption text-text-secondary hover:bg-hover" onClick={onAddBranch}><Plus size={12} color={theme.textMuted} strokeWidth={1.8} /><span>新建分支</span></button></>}</div>}
      </div>}
    </div>;
}
