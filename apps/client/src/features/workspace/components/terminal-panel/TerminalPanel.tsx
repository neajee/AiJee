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
        <div className={"block"}>
          <div>
            <span>
              Terminal 1
            </span>
            <button className={"block"}>
              <X size={12} color={textMuted} strokeWidth={2} />
            </button>
          </div>

          <button className={"block"}>
            <Plus size={18} color={textMuted} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className={"block"}>
        <span className={"  font-mono"}>
          <span className={"text-success"}>~</span>{' '}
          <span className={"block"}>$</span> _
        </span>
      </div>
    </div>;
}
const styles = {
  container: {
    height: 240,
    borderTopWidth: 0.633
  },
  tabBar: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 0.633,
    paddingLeft: 24,
    paddingRight: 24
  },
  tabBarLeft: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 4
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 4,
    borderBottomWidth: 1.9,
    marginBottom: -0.633
  },
  tabText: {
    fontSize: 14,
    fontFamily: Fonts.sans
  },
  tabClose: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addTabButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  terminalContent: {
    flex: 1,
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 12
  },
  terminalLine: {
    fontSize: 13,
    lineHeight: 20
  }
} as const;
