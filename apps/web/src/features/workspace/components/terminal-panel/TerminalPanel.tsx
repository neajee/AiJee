import { X, Plus } from 'lucide-react';
import { Fonts } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
export function TerminalPanel() {
  const colors = useThemeTokens();
  const surfaceBg = colors.background;
  const topBorder = colors.borderStrong;
  const tabDivider = colors.border;
  const activeTabBorder = colors.accent;
  const textPrimary = colors.text;
  const textMuted = colors.textTertiary;
  return <div>
      {/* Tab bar */}
      <div>
        <div className="flex flex-col">
          <div>
            <span>
              Terminal 1
            </span>
            <button className="inline-flex items-center">
              <X size={12} color={textMuted} strokeWidth={2} />
            </button>
          </div>

          <button className="inline-flex items-center">
            <Plus size={18} color={textMuted} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className="flex flex-col">
        <span className={"  font-mono"}>
          <span className={"text-success"}>~</span>{' '}
          <span className="inline-block">$</span> _
        </span>
      </div>
    </div>;
}