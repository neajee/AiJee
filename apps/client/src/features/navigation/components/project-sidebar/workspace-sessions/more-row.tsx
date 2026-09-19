import { toTailwind } from "@/styles/to-tailwind";
import { useState } from 'react';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { styles } from '../style-tokens';
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
      <span className={toTailwind([styles.moreText, {
      color: hovered ? colors.textSecondary : colors.textTertiary
    }])}>{label}</span>
    </button>;
}
