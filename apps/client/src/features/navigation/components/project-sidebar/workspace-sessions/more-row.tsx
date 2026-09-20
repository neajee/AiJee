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
  return <button onClick={onClick} disabled={disabled} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <span>{label}</span>
    </button>;
}
