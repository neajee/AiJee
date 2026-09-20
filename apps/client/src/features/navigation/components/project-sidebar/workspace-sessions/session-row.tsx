import { useCallback, useEffect, useState } from 'react';
import { Alert } from "@/platform/browser";
import { Archive as ArchiveIcon, Pencil } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useIsSessionStreaming, type SessionListItem } from '@aijee/client-sdk';
import { SessionActivityIndicator } from '@/features/workspace/components/session-activity-indicator';
import { RowAction } from '../workspace-rows';
export function SessionRow({
  session,
  isSelected,
  hasUnread,
  onClick,
  onRename,
  onArchive,
  isDark
}: {
  session: SessionListItem;
  isSelected: boolean;
  hasUnread: boolean;
  onClick: () => void;
  onRename: (name: string) => Promise<void>;
  onArchive: () => Promise<void>;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const isWorking = useIsSessionStreaming(session.id);
  const [hovered, setHovered] = useState(false);
  const title = session.display_name ?? session.id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [busy, setBusy] = useState<'rename' | 'archive' | null>(null);
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
  const selectedBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const showActions = hovered || isSelected;
  useEffect(() => {
    if (!editing) setDraft(title);
  }, [editing, title]);
  const commitRename = useCallback(async () => {
    const name = draft.trim();
    if (!name || name === title) {
      setEditing(false);
      setDraft(title);
      return;
    }
    setBusy('rename');
    try {
      await onRename(name);
      setEditing(false);
    } catch {
      Alert.alert('重命名失败', '无法保存对话名称，请重试。');
    } finally {
      setBusy(null);
    }
  }, [draft, onRename, title]);
  const handleArchive = useCallback(async () => {
    if (busy) return;
    setBusy('archive');
    try {
      await onArchive();
    } catch {
      setBusy(null);
      Alert.alert('归档失败', '无法归档该对话，请重试。');
    }
  }, [busy, onArchive]);
  const status = <div className="flex flex-col">{isWorking ? <SessionActivityIndicator sessionId={session.id} color={colors.textSecondary} idlePlaceholder={false} /> : hasUnread ? <div /> : null}</div>;
  return <div className={`group flex h-[26px] w-full min-w-0 items-center gap-1 rounded-md px-2 text-xs ${isSelected ? 'bg-active' : ''}`} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {editing ? <div className="flex min-w-0 flex-1 items-center gap-1">{status}<input autoFocus value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter") void commitRename(); if (event.key === "Escape") setEditing(false); }} disabled={busy === 'rename'} maxLength={200} className="h-[22px] min-w-0 flex-1 rounded bg-transparent font-sans outline-none" /></div> : <button className={`flex min-w-0 flex-1 items-center gap-1 text-left ${isSelected ? 'font-medium' : ''}`} onClick={onClick}>{status}<span className="min-w-0 flex-1 truncate font-sans">{title}</span></button>}
      {showActions && !editing && <div className="flex shrink-0 items-center">
        <RowAction label="重命名对话" onClick={() => setEditing(true)} isDark={isDark}><Pencil size={11} color={colors.textTertiary} strokeWidth={1.8} /></RowAction>
        <RowAction label="归档对话" onClick={() => void handleArchive()} isDark={isDark}>{busy === 'archive' ? <span className={"w-[10px] h-[10px]" + " size-3 animate-spin"} /> : <ArchiveIcon size={11} color={colors.textTertiary} strokeWidth={1.8} />}</RowAction>
      </div>}
    </div>;
}
