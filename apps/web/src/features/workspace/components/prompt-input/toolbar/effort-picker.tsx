import { Animated } from "@/styles/motion";
import { ChevronDown } from 'lucide-react';
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
  return <div className="relative min-w-0">
      <button className="flex h-7 min-w-0 items-center gap-1.5 rounded-md px-2 text-caption text-text-secondary hover:bg-hover disabled:opacity-40" onClick={() => isWideScreen ? toggleDropdown('effort') : onOpenNarrowSheet('effort')} disabled={toolbarDisabled || thinkingDisabled} role="button" aria-label={thinkingDisabled ? `Thinking not supported by ${currentModel?.name ?? 'this model'}` : `Thinking: ${thinkingLabel}. Press to change.`}>
        <span className="min-w-0 flex-1 truncate">{thinkingLabel}</span>
        {!thinkingDisabled && <ChevronDown className="shrink-0" size={14} color={theme.textMuted} strokeWidth={1.8} />}
      </button>
      {isWideScreen && activeDropdown === 'effort' && <div role="menu" aria-label="Thinking level selection" className="absolute bottom-full right-0 z-50 mb-1 min-w-32 rounded-md border border-border bg-card p-1 shadow-xl">
        {effortOptions.map((item, index) => {
        const highlighted = index === popoverIndex;
        const active = item.level === thinkingPreference;
        return <button className={`flex h-7 w-full items-center rounded px-1.5 text-left text-caption hover:bg-hover ${active ? 'bg-active' : ''}`} key={item.level} onClick={() => handleSelectThinking(item.level)} role="menuitem" aria-label={item.description ? `${item.label} — ${item.description}` : item.label}>
            <span>{item.label}</span>
          </button>;
      })}
      </div>}
    </div>;
}
