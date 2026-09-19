import type { ReactNode } from 'react';
import { Pressable } from "@/components/dom";
import { styles } from './style-tokens';

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
