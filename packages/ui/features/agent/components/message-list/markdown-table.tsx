import {
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
} from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

/**
 * Markdown tables that fit the message column.
 *
 * react-native-marked sizes every column at 43% of the *window* width, so a
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
    ...(element.type === Text
      ? { style: [element.props.style, styles.cellText] }
      : {}),
    ...(children === undefined
      ? {}
      : { children: normalizeCellTypography(children) }),
  });
}

export const MarkdownTable = memo(function MarkdownTable({
  header,
  rows,
  isDark,
}: MarkdownTableProps) {
  const colors = useThemeTokens();
  const columnCount = Math.max(
    header.length,
    ...rows.map((row) => row.length),
    1,
  );
  const scrolls = columnCount > SCROLL_AFTER_COLUMNS;

  const cellStyle = scrolls
    ? { width: SCROLLED_COLUMN_WIDTH }
    : { flex: 1, minWidth: 0 };

  const table = (
    <View
      style={[
        styles.table,
        {
          borderColor: colors.border,
          backgroundColor: colors.background,
          minWidth: scrolls ? undefined : "100%",
        },
      ]}
    >
      {header.length > 0 && (
        <View style={[styles.row, { backgroundColor: colors.surfaceRaised }]}>
          {header.map((cell, index) => (
            <View
              key={index}
              style={[
                styles.cell,
                cellStyle,
                index > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
              ]}
            >
              {/* Header cells arrive as inline nodes; wrapping in Text keeps the
                  emphasis without a second block-level box. */}
              <Text style={[styles.cellText, styles.headerText]}>
                {normalizeCellTypography(cell)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.row,
            { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
          ]}
        >
          {row.map((cell, cellIndex) => (
            <View
              key={cellIndex}
              style={[
                styles.cell,
                cellStyle,
                cellIndex > 0 && {
                  borderLeftWidth: StyleSheet.hairlineWidth,
                  borderLeftColor: colors.border,
                },
              ]}
            >
              {normalizeCellTypography(cell)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  if (!scrolls) return <View style={styles.wrap}>{table}</View>;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={styles.wrap}
      contentContainerStyle={styles.scrollContent}
    >
      {table}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 6,
  },
  scrollContent: {
    // Lets a narrow table still fill the column when scrolling is on.
    minWidth: "100%",
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  cell: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    justifyContent: "center",
  },
  headerText: {
    fontWeight: "600",
  },
  cellText: {
    fontSize: 13,
    lineHeight: 19,
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
});
