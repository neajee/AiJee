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
  return <button className={`flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-hover ${active ? 'bg-hover' : ''}`} role="button" aria-label={label} onClick={onClick}>
      {children}
    </button>;
}
