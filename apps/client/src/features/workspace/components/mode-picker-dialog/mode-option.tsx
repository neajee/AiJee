import { toTailwind } from "@/styles/to-tailwind";
import { Check, CircleOff, Star } from 'lucide-react';
import type { AgentMode } from '@aijee/client-sdk';
import { styles } from './style-tokens';
interface ModeOptionProps {
  mode?: AgentMode;
  selected: boolean;
  borderColor: string;
  selectedBg: string;
  selectedBorder: string;
  textPrimary: string;
  textMuted: string;
  onPress: () => void;
}
export function ModeOption({
  mode,
  selected,
  borderColor,
  selectedBg,
  selectedBorder,
  textPrimary,
  textMuted,
  onPress
}: ModeOptionProps) {
  const parts: string[] = [];
  if (mode?.model) parts.push(mode.model);
  if (mode?.thinking_level) parts.push(`thinking: ${mode.thinking_level}`);
  const extensionCount = Array.isArray(mode?.extensions) ? mode.extensions.length : 0;
  if (extensionCount) parts.push(`${extensionCount} ext`);
  return <button onClick={onPress} className={toTailwind([styles.option, {
    borderColor: selected ? selectedBorder : borderColor,
    backgroundColor: selected ? selectedBg : 'transparent'
  }])}>
      <div className={toTailwind(styles.optionHeader)}>
        <div className={toTailwind(styles.optionNameRow)}>
          {mode ? <span className={toTailwind([styles.optionName, {
          color: textPrimary
        }])}>{mode.name}</span> : <><CircleOff size={14} color={textMuted} strokeWidth={1.8} /><span className={toTailwind([styles.optionName, {
            color: textPrimary
          }])}>Default</span></>}
          {mode?.is_default && <Star size={12} color="#E8A300" fill="#E8A300" strokeWidth={1.8} />}
        </div>
        {selected && <Check size={16} color={textPrimary} strokeWidth={2} />}
      </div>
      {mode ? mode.description ? <span className={toTailwind([styles.optionDesc, {
      color: textMuted
    }])}>{mode.description}</span> : null : <span className={toTailwind([styles.optionDesc, {
      color: textMuted
    }])}>No extra configuration — standard pi session</span>}
      {parts.length > 0 && <span className={toTailwind([styles.optionDetail, {
      color: textMuted
    }])}>{parts.join(' · ')}</span>}
    </button>;
}
