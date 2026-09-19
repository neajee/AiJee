import { toTailwind } from "@/styles/to-tailwind";
import { RotateCw } from 'lucide-react';
import { TaskSelector } from '@/features/tasks/components/task-selector';
import { styles } from '../../../utils/toolbar-styles';
import { EffortPicker } from './effort-picker';
import { ModeToggle } from './mode-toggle';
import { ModelPicker } from './model-picker';
import type { ToolbarController } from './component-types';
export function ToolbarView(controller: ToolbarController) {
  const {
    theme,
    appMode,
    skeleton,
    isWideScreen,
    inline,
    currentModel,
    agentState,
    configError,
    configRetry,
    toolbarRef,
    activeDropdown,
    showTaskSelector
  } = controller;
  if (configError && !agentState) {
    return <div className={toTailwind(inline ? styles.inlineWrap : styles.wrap)}>
        <div className={toTailwind([inline ? styles.inlineToolbar : styles.toolbar, styles.toolbarError, !inline && {
        backgroundColor: theme.toolbarBg,
        borderColor: theme.toolbarBorder
      }])}>
          <span className={toTailwind([styles.errorText, {
          color: theme.textMuted
        }])}>Failed to load</span>
          <button onClick={configRetry} role="button" aria-label="Retry loading toolbar">
            <RotateCw size={12} color={theme.accentColor} strokeWidth={2} /><span className={toTailwind([styles.retryText, {
            color: theme.accentColor
          }])}>Retry</span>
          </button>
        </div>
      </div>;
  }
  if (!agentState && !currentModel) return <>{skeleton}</>;
  return <div ref={toolbarRef} className={toTailwind([inline ? styles.inlineWrap : styles.wrap, activeDropdown && {
    zIndex: 10
  }])}>
      <div className={toTailwind([inline ? styles.inlineToolbar : styles.toolbar, !inline && {
      backgroundColor: theme.toolbarBg,
      borderColor: theme.toolbarBorder
    }])}>
        <ModelPicker {...controller} />
        <EffortPicker {...controller} />
        {!inline && <div className={toTailwind(styles.spacer)} />}
        {showTaskSelector && appMode === 'code' && isWideScreen && <div className={toTailwind(styles.taskSelector)}><TaskSelector placement="above" /></div>}
        <ModeToggle {...controller} />
      </div>
    </div>;
}
