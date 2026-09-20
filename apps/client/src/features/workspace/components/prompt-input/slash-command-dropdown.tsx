import { useRef, useEffect } from 'react';
import { Animated } from "@/styles/motion";
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
  return <div className={"  bg-surface border-border opacity-100"}>
      <div ref={scrollRef} className="flex flex-col">
        {commands.map((cmd, index) => <button key={cmd.name} onClick={() => onSelect(cmd)} role="menuitem" aria-label={`/${cmd.name} — ${cmd.description}`}>
            <span className={"  text-foreground"}>
              /{cmd.name}
            </span>
            <span className={"  text-text-secondary"}>
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
