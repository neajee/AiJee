import { Check, CircleOff, Star } from 'lucide-react';
import type { AgentMode } from '@aijee/client-sdk';
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
  return <button onClick={onPress} className={"" + " " + ""}>
      <div className={""}>
        <div className={""}>
          {mode ? <span className={"" + " " + ""}>{mode.name}</span> : <><CircleOff size={14} color={textMuted} strokeWidth={1.8} /><span className={"" + " " + ""}>Default</span></>}
          {mode?.is_default && <Star size={12} color="#E8A300" fill="#E8A300" strokeWidth={1.8} />}
        </div>
        {selected && <Check size={16} color={textPrimary} strokeWidth={2} />}
      </div>
      {mode ? mode.description ? <span className={"" + " " + ""}>{mode.description}</span> : null : <span className={"" + " " + ""}>No extra configuration — standard pi session</span>}
      {parts.length > 0 && <span className={"" + " " + ""}>{parts.join(' · ')}</span>}
    </button>;
}
