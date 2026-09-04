import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { styles } from '../styles';

export function MoreRow({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable onPress={onPress} disabled={disabled} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)} style={({ pressed }) => [styles.moreRow, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.moreText, { color: hovered ? colors.textSecondary : colors.textTertiary }]}>{label}</Text>
    </Pressable>
  );
}
