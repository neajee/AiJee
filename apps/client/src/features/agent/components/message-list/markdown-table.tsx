import { cloneElement, isValidElement, memo, type ReactElement, type ReactNode } from "react";

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
    className?: string;
  }>;
  const children = element.props.children;
  return cloneElement(element, {
    className: ["text-[13px] leading-[19px]", element.props.className].filter(Boolean).join(" "),
    ...(children === undefined ? {} : {
      children: normalizeCellTypography(children)
    })
  });
}
export const MarkdownTable = memo(function MarkdownTable({
  header,
  rows
}: MarkdownTableProps) {
  const columnCount = Math.max(header.length, ...rows.map(row => row.length), 1);
  const scrolls = columnCount > SCROLL_AFTER_COLUMNS;
  const table = <div className={"  border-border bg-background"}>
      {header.length > 0 && <div className={"  bg-surface-raised"}>
          {header.map((cell, index) => <div key={index}>
              {/* Header cells arrive as inline nodes; wrapping in Text keeps the
                  emphasis without a second block-level box. */}
              <span>
                {normalizeCellTypography(cell)}
              </span>
            </div>)}
        </div>}

      {rows.map((row, rowIndex) => <div key={rowIndex}>
          {row.map((cell, cellIndex) => <div key={cellIndex}>
              {normalizeCellTypography(cell)}
            </div>)}
        </div>)}
    </div>;
  if (!scrolls) return <div className="flex flex-col">{table}</div>;
  return <div horizontal className="flex flex-col">
      {table}
    </div>;
});