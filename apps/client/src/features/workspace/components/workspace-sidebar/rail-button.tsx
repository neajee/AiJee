import type { ReactNode } from 'react';
interface RailButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  children: ReactNode;
}
export function RailButton({
  label,
  active,
  onPress,
  children
}: RailButtonProps) {
  return <button role="button" aria-label={label} onClick={onPress}>
      {children}
    </button>;
}
