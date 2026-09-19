import { toTailwind } from "@/styles/to-tailwind";
import { memo, useRef, useEffect, useMemo } from 'react';
import { Animated } from "@/platform/animation";
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
  return <div visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <div className={toTailwind(styles.modalRoot)}>
        <div className={toTailwind([styles.overlay, {
        opacity: overlayAnim
      }])}>
          <button className={toTailwind(ABSOLUTE_FILL_STYLE)} onClick={handleClose} />
        </div>
        <div className={toTailwind([styles.container, {
        backgroundColor: theme.isDark ? '#1e1e1e' : '#FFFFFF',
        transform: [{
          translateY: slideAnim
        }]
      }])}>
          <div className={toTailwind(styles.handle)}>
            <div className={toTailwind([styles.handleBar, {
            backgroundColor: theme.isDark ? '#555' : '#CCC'
          }])} />
          </div>
          <span className={toTailwind([styles.title, {
          color: theme.textPrimary
        }])}>思考深度</span>
          {[{
          level: 'auto' as const,
          label: 'Auto'
        }, ...thinkingOptions].map(item => {
          const isActive = item.level === thinkingPreference;
          return <button key={item.level} onClick={() => handleSelect(item.level)}>
                <div>
                  <span className={toTailwind([styles.label, {
                color: isActive ? theme.accentColor : theme.textPrimary
              }])}>
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
