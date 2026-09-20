import { Animated } from "@/styles/motion";
import { ChevronDown } from 'lucide-react';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './component-types';
type EffortPickerProps = Pick<ToolbarController, 'theme' | 'inline' | 'isWideScreen' | 'onOpenNarrowSheet' | 'currentModel' | 'toolbarDisabled' | 'controlHeight' | 'thinkingDisabled' | 'thinkingLabel' | 'thinkingPreference' | 'effortOptions' | 'activeDropdown' | 'toggleDropdown' | 'toolbarDropdownAnim' | 'popoverIndex' | 'handleSelectThinking'>;
export function EffortPicker({
  theme,
  inline,
  isWideScreen,
  onOpenNarrowSheet,
  currentModel,
  toolbarDisabled,
  controlHeight,
  thinkingDisabled,
  thinkingLabel,
  thinkingPreference,
  effortOptions,
  activeDropdown,
  toggleDropdown,
  toolbarDropdownAnim,
  popoverIndex,
  handleSelectThinking
}: EffortPickerProps) {
  return <div className={"block"}>
      <button onClick={() => isWideScreen ? toggleDropdown('effort') : onOpenNarrowSheet('effort')} disabled={toolbarDisabled || thinkingDisabled} role="button" aria-label={thinkingDisabled ? `Thinking not supported by ${currentModel?.name ?? 'this model'}` : `Thinking: ${thinkingLabel}. Press to change.`}>
        <span className={"  text-text-secondary"}>{thinkingLabel}</span>
        {!thinkingDisabled && <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />}
      </button>
      {isWideScreen && activeDropdown === 'effort' && <div role="menu" aria-label="Thinking level selection" className={"  bg-surface border-border opacity-100"}>
        {effortOptions.map((item, index) => {
        const highlighted = index === popoverIndex;
        const active = item.level === thinkingPreference;
        return <button key={item.level} onClick={() => handleSelectThinking(item.level)} role="menuitem" aria-label={item.description ? `${item.label} — ${item.description}` : item.label}>
            <div className={"block"}><span>{item.label}</span></div>
          </button>;
      })}
      </div>}
    </div>;
}
