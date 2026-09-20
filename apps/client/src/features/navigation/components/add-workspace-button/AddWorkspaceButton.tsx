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
const styles = {
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  wrapperVertical: {
    alignSelf: 'stretch',
    height: 44
  },
  wrapperHorizontal: {
    width: 50,
    height: 54
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  }
} as const;
