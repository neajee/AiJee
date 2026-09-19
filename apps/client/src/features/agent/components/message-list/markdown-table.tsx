import { toTailwind } from "@/styles/to-tailwind";
import { cloneElement, isValidElement, memo, type ReactElement, type ReactNode } from "react";
import { Colors } from "@/constants/theme";
import { HAIRLINE_WIDTH } from "@/constants/layout";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

/**
 * Markdown tables that fit the message column.
 *
 * @/platform/markdown sizes every column at 43% of the *window* width, so a
 * two-column table already overflows a chat bubble that only owns part of the
 * screen, and the text gets clipped at the edge. Narrow tables here divide the
 * available width instead; only genuinely wide ones fall back to scrolling,
 * where a fixed minimum keeps cells readable rather than one word per line.
 */

/** Above this, columns stop sharing the width and start scrolling. */
const SCROLL_AFTER_COLUMNS = 4;
const SCROLLED_COLUMN_WIDTH = 150;
interface MarkdownTableProps {
  header: ReactNode[][];
  rows: ReactNode[][][];
  isDark: boolean;
}
function normalizeCellTypography(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(normalizeCellTypography);
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<{
    children?: ReactNode;
    style?: unknown;
  }>;
  const children = element.props.children;
  return cloneElement(element, {
    ...(element.type === Text ? {
      style: [element.props.style, styles.cellText]
    } : {}),
    ...(children === undefined ? {} : {
      children: normalizeCellTypography(children)
    })
  });
}
export const MarkdownTable = memo(function MarkdownTable({
  header,
  rows,
  isDark
}: MarkdownTableProps) {
  const colors = useThemeTokens();
  const columnCount = Math.max(header.length, ...rows.map(row => row.length), 1);
  const scrolls = columnCount > SCROLL_AFTER_COLUMNS;
  const cellStyle = scrolls ? {
    width: SCROLLED_COLUMN_WIDTH
  } : {
    flex: 1,
    minWidth: 0
  };
  const table = <div className={toTailwind([styles.table, {
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: scrolls ? undefined : "100%"
  }])}>
      {header.length > 0 && <div className={toTailwind([styles.row, {
      backgroundColor: colors.surfaceRaised
    }])}>
          {header.map((cell, index) => <div key={index} className={toTailwind([styles.cell, cellStyle, index > 0 && {
        borderLeftWidth: HAIRLINE_WIDTH,
        borderLeftColor: colors.border
      }])}>
              {/* Header cells arrive as inline nodes; wrapping in Text keeps the
                  emphasis without a second block-level box. */}
              <span className={toTailwind([styles.cellText, styles.headerText])}>
                {normalizeCellTypography(cell)}
              </span>
            </div>)}
        </div>}

      {rows.map((row, rowIndex) => <div key={rowIndex} className={toTailwind([styles.row, {
      borderTopWidth: HAIRLINE_WIDTH,
      borderTopColor: colors.border
    }])}>
          {row.map((cell, cellIndex) => <div key={cellIndex} className={toTailwind([styles.cell, cellStyle, cellIndex > 0 && {
        borderLeftWidth: HAIRLINE_WIDTH,
        borderLeftColor: colors.border
      }])}>
              {normalizeCellTypography(cell)}
            </div>)}
        </div>)}
    </div>;
  if (!scrolls) return <div className={toTailwind(styles.wrap)}>{table}</div>;
  return <div horizontal className={toTailwind(styles.wrap)}>
      {table}
    </div>;
});
const styles = {
  wrap: {
    marginTop: 6,
    marginBottom: 6
  },
  scrollContent: {
    // Lets a narrow table still fill the column when scrolling is on.
    minWidth: "100%"
  },
  table: {
    borderWidth: HAIRLINE_WIDTH,
    borderRadius: 6,
    overflow: "hidden"
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  cell: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 7,
    paddingBottom: 7,
    justifyContent: "center"
  },
  headerText: {
    fontWeight: "600"
  },
  cellText: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "100%",
    alignSelf: "flex-start"
  }
} as const;
