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
    return <div className={inline ? "" : ""}>
        <div className={(inline ? "" : "") + " " + "" + " " + (!inline ? "" : "")}>
          <span className={"" + " " + ""}>Failed to load</span>
          <button onClick={configRetry} role="button" aria-label="Retry loading toolbar">
            <RotateCw size={12} color={theme.accentColor} strokeWidth={2} /><span className={"" + " " + ""}>Retry</span>
          </button>
        </div>
      </div>;
  }
  if (!agentState && !currentModel) return <>{skeleton}</>;
  return <div ref={toolbarRef} className={(inline ? "" : "") + " " + (activeDropdown ? "z-[10]" : "")}>
      <div className={(inline ? "" : "") + " " + (!inline ? "" : "")}>
        <ModelPicker {...controller} />
        <EffortPicker {...controller} />
        {!inline && <div className={""} />}
        {showTaskSelector && appMode === 'code' && isWideScreen && <div className={""}><TaskSelector placement="above" /></div>}
        <ModeToggle {...controller} />
      </div>
    </div>;
}
