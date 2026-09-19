import { toTailwind } from "@/styles/to-tailwind";
import { Ellipsis, FolderOpen } from 'lucide-react';
import { NarrowHeaderActionsSheet } from '@/features/navigation/components/narrow-header-actions-sheet';
import { useNarrowHeaderController } from '../../hooks/use-narrow-header-controller';
import { styles } from './style-tokens';
import type { NarrowHeaderBarProps } from './component-types';
export function NarrowHeaderBar(props: NarrowHeaderBarProps) {
  const {
    colors,
    textPrimary,
    borderColor,
    buttonBg,
    appMode,
    workspace,
    actionItems,
    moreVisible,
    setMoreVisible,
    closeMore
  } = useNarrowHeaderController(props);
  return <>
      <div className={toTailwind([styles.container, {
      backgroundColor: colors.background,
      borderBottomColor: borderColor
    }])}>
        <div className={toTailwind(styles.leftSection)}>
          <button onClick={props.onWorkspacePress} role="button" aria-label="Open workspace switcher">
            {workspace && <div className={toTailwind([styles.avatar, {
            backgroundColor: workspace.color
          }])}>
                <span className={toTailwind(styles.avatarInitial)}>{workspace.title.charAt(0).toUpperCase()}</span>
              </div>}
            <span className={toTailwind([styles.workspaceName, {
            color: textPrimary
          }])}>
              {workspace?.title ?? 'Workspace'}
            </span>
          </button>
        </div>
        <div className={toTailwind(styles.headerActions)}>
          <button onClick={props.onFilesPress} role="button" aria-label="Files">
            <FolderOpen size={16} color={textPrimary} strokeWidth={1.8} />
          </button>
          {appMode === 'code' && actionItems.length > 0 && <button onClick={() => setMoreVisible(true)} role="button" aria-label="More actions">
              <Ellipsis size={16} color={textPrimary} strokeWidth={1.8} />
            </button>}
        </div>
      </div>
      <NarrowHeaderActionsSheet visible={moreVisible} onClose={closeMore} items={actionItems} />
    </>;
}
