import { toTailwind } from "@/styles/to-tailwind";
import { useRef, useEffect } from 'react';
import { Animated } from "@/platform/animation";
import { Fonts } from '@/constants/theme';
import { SlashCommand } from '../../utils/prompt-input';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
interface SlashCommandDropdownProps {
  commands: SlashCommand[];
  selectedIndex: number;
  dropdownAnim: Animated.Value;
  overlay?: boolean;
  onSelect: (command: SlashCommand) => void;
}
export function SlashCommandDropdown({
  commands,
  selectedIndex,
  dropdownAnim,
  overlay = false,
  onSelect
}: SlashCommandDropdownProps) {
  const theme = usePromptTheme();
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      y: selectedIndex * 36,
      animated: true
    });
  }, [selectedIndex]);
  return <div className={toTailwind([styles.container, overlay ? styles.overlayContainer : styles.stackedContainer, {
    backgroundColor: theme.dropdownBg,
    borderColor: theme.dropdownBorder,
    opacity: dropdownAnim,
    transform: [{
      translateY: dropdownAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 0]
      })
    }],
    ...(overlay ? {
      boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.14)'
    } : {})
  }])}>
      <div ref={scrollRef} className={toTailwind(styles.scroll)} keyboardShouldPersistTaps="handled">
        {commands.map((cmd, index) => <button key={cmd.name} onClick={() => onSelect(cmd)} role="menuitem" aria-label={`/${cmd.name} — ${cmd.description}`} accessibilityState={{
        selected: index === selectedIndex
      }}>
            <span className={toTailwind([styles.name, {
          color: theme.textPrimary
        }])}>
              /{cmd.name}
            </span>
            <span className={toTailwind([styles.desc, {
          color: theme.textMuted
        }])}>
              {cmd.description}
            </span>
          </button>)}
      </div>
    </div>;
}
const styles = {
  container: {
    borderWidth: 0.633,
    overflow: 'hidden'
  },
  stackedContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 0,
    zIndex: 2
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    marginBottom: 8,
    borderRadius: 12,
    zIndex: 20,
    elevation: 12
  },
  scroll: {
    maxHeight: 260
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    height: 36,
    gap: 12
  },
  name: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    minWidth: 80
  },
  desc: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    flex: 1
  }
} as const;
