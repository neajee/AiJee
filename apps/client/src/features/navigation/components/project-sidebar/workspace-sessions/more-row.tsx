import { useState } from 'react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
export function MoreRow({
  label,
  onClick,
  disabled
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  return <button className="flex h-6 w-full items-center rounded-md px-2 text-left text-xs text-text-secondary hover:bg-hover disabled:opacity-40" onClick={onClick} disabled={disabled} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <span className="truncate">{label}</span>
    </button>;
}
