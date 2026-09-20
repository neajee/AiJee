import { useState } from 'react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
export function MoreRow({
  label,
  onPress,
  disabled
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  return <button onClick={onPress} disabled={disabled} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <span className={" "}>{label}</span>
    </button>;
}
