import type { ReactNode } from 'react';
interface RailButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}
export function RailButton({
  label,
  active,
  onClick,
  children
}: RailButtonProps) {
  return <button role="button" aria-label={label} onClick={onClick}>
      {children}
    </button>;
}
