import { memo, useRef, useEffect, useMemo } from 'react';
import { Animated } from "@/styles/motion";
import { Check } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { buildThinkingLevelOptions, ThinkingPreference } from '../../utils/prompt-input';
import { usePromptTheme } from '@/components/surface-theme/use-prompt-theme';
import type { AgentConfigHandle } from '@aijee/client-sdk';
interface NarrowEffortSheetProps {
  visible: boolean;
  sessionId?: string | null;
  onClose: () => void;
  config: AgentConfigHandle;
  thinkingPreference?: ThinkingPreference;
  onThinkingPreferenceChange?: (level: ThinkingPreference) => void;
}
function NarrowEffortSheetComponent({
  visible,
  sessionId,
  onClose,
  config,
  thinkingPreference = 'auto',
  onThinkingPreferenceChange
}: NarrowEffortSheetProps) {
  const theme = usePromptTheme();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Only offer the levels the current model actually supports.
  const thinkingOptions = useMemo(() => buildThinkingLevelOptions(config.availableThinkingLevels), [config.availableThinkingLevels]);
  useEffect(() => {
    if (visible) {
      Animated.parallel([Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }), Animated.spring(slideAnim, {
        toValue: 0,
        tension: 120,
        friction: 14,
        useNativeDriver: true
      })]).start();
    }
  }, [overlayAnim, slideAnim, visible]);
  const animateClose = (cb: () => void) => {
    Animated.parallel([Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }), Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true
    })]).start(() => cb());
  };
  const handleClose = () => {
    animateClose(() => onClose());
  };
  const handleSelect = (level: ThinkingPreference) => {
    onThinkingPreferenceChange?.(level);
    if (level !== 'auto') config.setThinkingLevel(level);
    animateClose(() => onClose());
  };
  return <div hidden={!visible}>
      <div className="flex flex-col">
        <div className={"  opacity-100"}>
          <button className="inline-flex items-center" onClick={handleClose} />
        </div>
        <div>
          <div className="flex flex-col">
            <div />
          </div>
          <span className={"  text-foreground"}>思考深度</span>
          {[{
          level: 'auto' as const,
          label: 'Auto'
        }, ...thinkingOptions].map(item => {
          const isActive = item.level === thinkingPreference;
          return <button key={item.level} onClick={() => handleSelect(item.level)}>
                <div>
                  <span>
                    {item.label}
                  </span>
                </div>
                {isActive && <Check size={16} color={theme.accentColor} strokeWidth={2} />}
              </button>;
        })}
        </div>
      </div>
    </div>;
}
export const NarrowEffortSheet = memo(NarrowEffortSheetComponent);
const styles = {
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  overlay: {
    ...ABSOLUTE_FILL_STYLE,
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  container: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingBottom: 34,
    maxHeight: '70%'
  },
  handle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2
  },
  title: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 12
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 11,
    paddingBottom: 11
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium
  }
} as const;
