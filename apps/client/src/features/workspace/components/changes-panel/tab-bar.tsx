import { toTailwind } from "@/styles/to-tailwind";
import type { ReactNode } from "react";
import { Fonts } from "@/constants/theme";
import { useChangesTheme } from "../../hooks/use-changes-theme";
export interface TabItem {
  key: string;
  label: string;
  /** Rendered as a dimmed number after the label. */
  count?: number;
}

/**
 * The panel's one and only chrome row.
 *
 * Everything that used to sit in its own band — the pane switch, the section
 * switch and the branch — shares this row, which is three rows of vertical space
 * given back to the content. Labels size to their text and carry an underline;
 * a segmented control read as a form field and stretched to equal widths.
 */
export function TabBar({
  items,
  activeKey,
  onSelect,
  right
}: {
  items: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  right?: ReactNode;
}) {
  const {
    colors,
    surfaceBg,
    dividerColor,
    hoverBg
  } = useChangesTheme();
  return <div className={toTailwind([styles.tabBar, {
    backgroundColor: surfaceBg,
    borderBottomColor: dividerColor
  }])}>
      {items.map(item => {
      const isActive = activeKey === item.key;
      return <button key={item.key} onClick={() => onSelect(item.key)} role="tab" accessibilityState={{
        selected: isActive
      }}>
            <span className={toTailwind([styles.tabText, {
          color: isActive ? colors.text : colors.textTertiary
        }])}>
              {item.label}
            </span>
            {!!item.count && item.count > 0 && <span className={toTailwind([styles.tabCount, {
          color: isActive ? colors.textSecondary : colors.textTertiary
        }])}>
                {item.count}
              </span>}
            {isActive && <div className={toTailwind([styles.underline, {
          backgroundColor: colors.text
        }])} />}
          </button>;
    })}
      {!!right && <>
          <div className={toTailwind(styles.filler)} />
          {right}
        </>}
    </div>;
}
const styles = {
  tabBar: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 32,
    paddingLeft: 4,
    paddingRight: 8,
    borderBottomWidth: 0.633
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 5
  },
  tabText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium
  },
  tabCount: {
    fontSize: 11,
    fontFamily: Fonts.mono
  },
  underline: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    height: 1.5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1
  },
  filler: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 12
  }
} as const;
