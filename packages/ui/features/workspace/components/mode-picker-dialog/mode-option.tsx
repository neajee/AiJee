import { Text, View } from 'tamagui';
import { Check, CircleOff, Star } from 'lucide-react-native';
import { Pressable } from 'react-native';
import type { AgentMode } from '@aijee/client-sdk';
import { styles } from './styles';

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

export function ModeOption({ mode, selected, borderColor, selectedBg, selectedBorder, textPrimary, textMuted, onPress }: ModeOptionProps) {
  const parts: string[] = [];
  if (mode?.model) parts.push(mode.model);
  if (mode?.thinking_level) parts.push(`thinking: ${mode.thinking_level}`);
  const extensionCount = Array.isArray(mode?.extensions) ? mode.extensions.length : 0;
  if (extensionCount) parts.push(`${extensionCount} ext`);
  return (
    <Pressable onPress={onPress} style={[styles.option, { borderColor: selected ? selectedBorder : borderColor, backgroundColor: selected ? selectedBg : 'transparent' }]}>
      <View style={styles.optionHeader}>
        <View style={styles.optionNameRow}>
          {mode ? <Text style={[styles.optionName, { color: textPrimary }]}>{mode.name}</Text> : <><CircleOff size={14} color={textMuted} strokeWidth={1.8} /><Text style={[styles.optionName, { color: textPrimary }]}>Default</Text></>}
          {mode?.is_default && <Star size={12} color="#E8A300" fill="#E8A300" strokeWidth={1.8} />}
        </View>
        {selected && <Check size={16} color={textPrimary} strokeWidth={2} />}
      </View>
      {mode ? mode.description ? <Text style={[styles.optionDesc, { color: textMuted }]} numberOfLines={2}>{mode.description}</Text> : null : <Text style={[styles.optionDesc, { color: textMuted }]}>No extra configuration — standard pi session</Text>}
      {parts.length > 0 && <Text style={[styles.optionDetail, { color: textMuted }]} numberOfLines={1}>{parts.join(' · ')}</Text>}
    </Pressable>
  );
}
