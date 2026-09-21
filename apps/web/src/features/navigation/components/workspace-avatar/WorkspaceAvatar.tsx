import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
const OUTER_SIZE = 40;
const INNER_SIZE = 32;
const OUTER_RADIUS = 8;
const INNER_RADIUS = 4;
const ACTIVE_BORDER = 1.9;
const DOT_SIZE = 7;
interface WorkspaceAvatarProps {
  title: string;
  color: string;
  isActive: boolean;
  hasNotification: boolean;
  onClick: () => void;
  layout?: 'vertical' | 'horizontal';
}
function getLighterColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, r + 80);
  const lg = Math.min(255, g + 80);
  const lb = Math.min(255, b + 80);
  return `rgb(${lr}, ${lg}, ${lb})`;
}
export function WorkspaceAvatar({
  title,
  color,
  isActive,
  hasNotification,
  onClick,
  layout = 'vertical'
}: WorkspaceAvatarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  const initial = title.charAt(0).toUpperCase();
  const isVertical = layout === 'vertical';
  const isDark = colorScheme === 'dark';
  const activeBorderColor = isDark ? '#ede8e4' : '#1A1A1A';
  const innerBorderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.1)';
  const letterColor = getLighterColor(color);
  return <div>
      <div className="flex flex-col">
        <button onClick={onClick} role="button" aria-label={title}>
          <div>
            <span>{initial}</span>
          </div>
        </button>

        {hasNotification && <div className={"  bg-background"}>
            <div className={"  bg-primary"} />
          </div>}
      </div>

      {!isVertical && isActive && <div className={"  bg-accent"} />}
    </div>;
}