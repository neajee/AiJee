import { Text, View } from 'tamagui';
import { Animated, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './types';

type EffortPickerProps = Pick<ToolbarController, 'theme' | 'inline' | 'isWideScreen' | 'onOpenMobileSheet' | 'currentModel' | 'toolbarDisabled' | 'controlHeight' | 'thinkingDisabled' | 'thinkingLabel' | 'thinkingPreference' | 'effortOptions' | 'activeDropdown' | 'toggleDropdown' | 'toolbarDropdownAnim' | 'popoverIndex' | 'handleSelectThinking'>;

export function EffortPicker({ theme, inline, isWideScreen, onOpenMobileSheet, currentModel, toolbarDisabled, controlHeight, thinkingDisabled, thinkingLabel, thinkingPreference, effortOptions, activeDropdown, toggleDropdown, toolbarDropdownAnim, popoverIndex, handleSelectThinking }: EffortPickerProps) {
  return (
    <View style={styles.popoverAnchor}>
      <Pressable onPress={() => (isWideScreen ? toggleDropdown('effort') : onOpenMobileSheet('effort'))} disabled={toolbarDisabled || thinkingDisabled} accessibilityRole="button" accessibilityLabel={thinkingDisabled ? `Thinking not supported by ${currentModel?.name ?? 'this model'}` : `Thinking: ${thinkingLabel}. Press to change.`} accessibilityState={{ expanded: activeDropdown === 'effort', disabled: toolbarDisabled || thinkingDisabled }} style={({ pressed }) => [styles.button, styles.effortButton, { height: controlHeight }, (pressed || toolbarDisabled || thinkingDisabled) && { opacity: 0.7 }]}>
        <Text style={[styles.buttonText, { color: theme.textSecondary }]}>{thinkingLabel}</Text>
        {!thinkingDisabled && <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />}
      </Pressable>
      {isWideScreen && activeDropdown === 'effort' && <Animated.View accessibilityRole="menu" accessibilityLabel="Thinking level selection" style={[styles.popover, styles.effortPopover, inline ? { left: 'auto', right: 0 } : null, { backgroundColor: theme.dropdownBg, borderColor: theme.dropdownBorder, opacity: toolbarDropdownAnim, transform: [{ translateY: toolbarDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}>
        {effortOptions.map((item, index) => {
          const highlighted = index === popoverIndex;
          const active = item.level === thinkingPreference;
          return <Pressable key={item.level} onPress={() => handleSelectThinking(item.level)} accessibilityRole="menuitem" accessibilityLabel={item.description ? `${item.label} — ${item.description}` : item.label} accessibilityState={{ selected: active }} style={({ pressed, hovered }: any) => [styles.effortItem, highlighted && { backgroundColor: theme.selectedBg }, (pressed || hovered) && !highlighted && { backgroundColor: theme.hoverBg }]}>
            <View style={styles.effortRow}><Text style={[styles.effortLabel, { color: active ? theme.accentColor : theme.textPrimary }]}>{item.label}</Text></View>
          </Pressable>;
        })}
      </Animated.View>}
    </View>
  );
}
