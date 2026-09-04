import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { styles } from './styles';

interface RailButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  children: ReactNode;
}

export function RailButton({ label, active, onPress, children }: RailButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed, hovered }: any) => [
        styles.railButton,
        active && styles.railButtonActive,
        (pressed || hovered) && styles.railButtonActive,
      ]}
    >
      {children}
    </Pressable>
  );
}
