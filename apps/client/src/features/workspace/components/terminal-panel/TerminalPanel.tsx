import { toTailwind } from "@/styles/to-tailwind";
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
  return <div className={toTailwind([styles.container, {
    backgroundColor: surfaceBg,
    borderTopColor: topBorder
  }])}>
      {/* Tab bar */}
      <div className={toTailwind([styles.tabBar, {
      borderBottomColor: tabDivider
    }])}>
        <div className={toTailwind(styles.tabBarLeft)}>
          <div className={toTailwind([styles.tab, {
          borderBottomColor: activeTabBorder
        }])}>
            <span className={toTailwind([styles.tabText, {
            color: textPrimary
          }])}>
              Terminal 1
            </span>
            <button className={toTailwind(styles.tabClose)}>
              <X size={12} color={textMuted} strokeWidth={2} />
            </button>
          </div>

          <button className={toTailwind(styles.addTabButton)}>
            <Plus size={18} color={textMuted} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Terminal content */}
      <div className={toTailwind(styles.terminalContent)}>
        <span className={toTailwind([styles.terminalLine, {
        color: textMuted,
        fontFamily: Fonts.mono
      }])}>
          <span className={toTailwind({
          color: colors.success
        })}>~</span>{' '}
          <span className={toTailwind({
          color: textPrimary
        })}>$</span> _
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
