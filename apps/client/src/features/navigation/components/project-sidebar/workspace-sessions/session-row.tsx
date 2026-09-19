import { toTailwind } from "@/styles/to-tailwind";
import { useCallback, useEffect, useState } from 'react';
import { Alert } from "@/platform/browser";
import { Archive as ArchiveIcon, Pencil } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useIsSessionStreaming, type SessionListItem } from '@aijee/client-sdk';
import { SessionActivityIndicator } from '@/features/workspace/components/session-activity-indicator';
import { RowAction } from '../workspace-rows';
import { styles } from '../style-tokens';
export function SessionRow({
  session,
  isSelected,
  hasUnread,
  onPress,
  onRename,
  onArchive,
  isDark
}: {
  session: SessionListItem;
  isSelected: boolean;
  hasUnread: boolean;
  onPress: () => void;
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
  const status = <div className={toTailwind(styles.sessionLead)}>{isWorking ? <SessionActivityIndicator sessionId={session.id} color={colors.textSecondary} idlePlaceholder={false} /> : hasUnread ? <div className={toTailwind([styles.dot, {
      backgroundColor: isDark ? '#3FB950' : '#1A7F37'
    }])} /> : null}</div>;
  return <div className={toTailwind([styles.sessionRow, isSelected ? {
    backgroundColor: selectedBg
  } : hovered && {
    backgroundColor: hoverBg
  }])} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {editing ? <div className={toTailwind(styles.sessionMain)}>{status}<input autoFocus selectTextOnFocus underlineColorAndroid="transparent" value={draft} onChangeText={setDraft} onSubmitEditing={() => void commitRename()} onKeyPress={event => {
        if (event.nativeEvent.key === 'Escape') setEditing(false);
      }} editable={busy !== 'rename'} maxLength={200} selectionColor={colors.tint} className={toTailwind([styles.sessionInput, {
        color: colors.text,
        fontFamily: Fonts.sansMedium
      }])} /></div> : <button onClick={onPress}>{status}<span className={toTailwind([styles.sessionLabel, {
        color: isSelected ? colors.text : colors.textSecondary,
        fontFamily: isSelected ? Fonts.sansMedium : Fonts.sans
      }])}>{title}</span></button>}
      {showActions && !editing && <div className={toTailwind(styles.sessionActions)}>
        <RowAction label="重命名对话" onClick={() => setEditing(true)} isDark={isDark}><Pencil size={11} color={colors.textTertiary} strokeWidth={1.8} /></RowAction>
        <RowAction label="归档对话" onClick={() => void handleArchive()} isDark={isDark}>{busy === 'archive' ? <span size="small" color={colors.textTertiary} className={toTailwind({
          width: 10,
          height: 10
        })} /> : <ArchiveIcon size={11} color={colors.textTertiary} strokeWidth={1.8} />}</RowAction>
      </div>}
    </div>;
}
