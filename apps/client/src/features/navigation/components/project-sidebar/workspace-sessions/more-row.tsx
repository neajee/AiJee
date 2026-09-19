import { Text } from "@/components/dom";
import { useState } from 'react';
import { Pressable } from "@/components/dom";
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { styles } from '../style-tokens';

export function MoreRow({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable onPress={onPress} disabled={disabled} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [styles.moreRow, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.moreText, { color: hovered ? colors.textSecondary : colors.textTertiary }]}>{label}</Text>
    </Pressable>
  );
}
