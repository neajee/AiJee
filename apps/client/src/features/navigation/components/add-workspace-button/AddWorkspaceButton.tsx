import { Plus } from 'lucide-react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
interface AddWorkspaceButtonProps {
  onClick: () => void;
  layout?: 'vertical' | 'horizontal';
}
export function AddWorkspaceButton({
  onClick,
  layout = 'vertical'
}: AddWorkspaceButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = useThemeTokens();
  return <div>
      <button onClick={onClick} role="button" aria-label="Add workspace">
        <Plus size={20} color={colors.iconMuted} strokeWidth={1.8} />
      </button>
    </div>;
}