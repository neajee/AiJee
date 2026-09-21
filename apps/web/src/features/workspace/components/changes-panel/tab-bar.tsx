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
  return <div className="flex h-9 shrink-0 items-stretch border-b border-border bg-surface-raised px-1">
      {items.map(item => {
      const isActive = activeKey === item.key;
      return <button key={item.key} className={`relative flex items-center gap-1 px-2.5 text-caption ${isActive ? 'font-medium text-foreground' : 'text-text-secondary hover:bg-hover'}`} onClick={() => onSelect(item.key)} role="tab">
            <span>{item.label}</span>{!!item.count && item.count > 0 && <span className="font-mono text-meta text-text-tertiary">{item.count}</span>}
            {isActive && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>;
    })}
      {!!right && <>
          <div className="flex-1" />
          {right}
        </>}
    </div>;
}
