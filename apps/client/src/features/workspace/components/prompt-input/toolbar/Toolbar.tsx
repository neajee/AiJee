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
    return <div className="flex flex-col">
        <div className={"  bg-surface border-border"}>
          <span className={"  text-text-secondary"}>Failed to load</span>
          <button onClick={configRetry} role="button" aria-label="Retry loading toolbar">
            <RotateCw size={12} color={theme.accentColor} strokeWidth={2} /><span className={"  text-accent"}>Retry</span>
          </button>
        </div>
      </div>;
  }
  if (!agentState && !currentModel) return <>{skeleton}</>;
  return <div ref={toolbarRef} className={"  z-[10]"}>
      <div className={"  bg-surface border-border"}>
        <ModelPicker {...controller} />
        <EffortPicker {...controller} />
        {!inline && <div className="flex flex-col" />}
        {showTaskSelector && appMode === 'code' && isWideScreen && <div className="flex flex-col"><TaskSelector placement="above" /></div>}
        <ModeToggle {...controller} />
      </div>
    </div>;
}
