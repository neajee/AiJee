import { toTailwind } from "@/styles/to-tailwind";
import { Animated } from "@/platform/animation";
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
  return <div className={toTailwind(styles.popoverAnchor)}>
      <button onClick={() => isWideScreen ? toggleDropdown('effort') : onOpenNarrowSheet('effort')} disabled={toolbarDisabled || thinkingDisabled} role="button" aria-label={thinkingDisabled ? `Thinking not supported by ${currentModel?.name ?? 'this model'}` : `Thinking: ${thinkingLabel}. Press to change.`} accessibilityState={{
      expanded: activeDropdown === 'effort',
      disabled: toolbarDisabled || thinkingDisabled
    }}>
        <span className={toTailwind([styles.buttonText, {
        color: theme.textSecondary
      }])}>{thinkingLabel}</span>
        {!thinkingDisabled && <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />}
      </button>
      {isWideScreen && activeDropdown === 'effort' && <div role="menu" aria-label="Thinking level selection" className={toTailwind([styles.popover, styles.effortPopover, inline ? {
      left: 'auto',
      right: 0
    } : null, {
      backgroundColor: theme.dropdownBg,
      borderColor: theme.dropdownBorder,
      opacity: toolbarDropdownAnim,
      transform: [{
        translateY: toolbarDropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 0]
        })
      }]
    }])}>
        {effortOptions.map((item, index) => {
        const highlighted = index === popoverIndex;
        const active = item.level === thinkingPreference;
        return <button key={item.level} onClick={() => handleSelectThinking(item.level)} role="menuitem" aria-label={item.description ? `${item.label} — ${item.description}` : item.label} accessibilityState={{
          selected: active
        }}>
            <div className={toTailwind(styles.effortRow)}><span className={toTailwind([styles.effortLabel, {
              color: active ? theme.accentColor : theme.textPrimary
            }])}>{item.label}</span></div>
          </button>;
      })}
      </div>}
    </div>;
}
