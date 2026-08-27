import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts } from "@/constants/theme";
import type { Tab } from "./constants";
import { useChangesTheme } from "./use-theme-colors";

const TAB_LABELS: Record<Tab, string> = {
  changes: "Changes",
  files: "Files",
  history: "Log",
};

/**
 * Panel tabs.
 *
 * A segmented control stretched three equal pills across the panel and spent 48px
 * of height on 22px of content, which read as a form control rather than as
 * navigation. Left-aligned labels with an underline sit on the panel's own
 * hairline, size themselves to their text, and let the change count be a separate
 * dimmed number instead of part of the label.
 */
export function TabBar({
  activeTab,
  onTabChange,
  totalChanges,
  tabs,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  totalChanges: number;
  tabs: Tab[];
}) {
  const { colors, surfaceBg, dividerColor, hoverBg } = useChangesTheme();

  return (
    <View
      style={[
        styles.tabBar,
        { backgroundColor: surfaceBg, borderBottomColor: dividerColor },
      ]}
    >
      {tabs.map((key) => {
        const isActive = activeTab === key;
        return (
          <Pressable
            key={key}
            onPress={() => onTabChange(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={({ hovered }: any) => [
              styles.tab,
              hovered && !isActive && { backgroundColor: hoverBg },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? colors.text : colors.textTertiary },
              ]}
            >
              {TAB_LABELS[key]}
            </Text>
            {key === "changes" && totalChanges > 0 && (
              <Text
                style={[
                  styles.tabCount,
                  {
                    color: isActive ? colors.textSecondary : colors.textTertiary,
                  },
                ]}
              >
                {totalChanges}
              </Text>
            )}
            {isActive && (
              <View
                style={[styles.underline, { backgroundColor: colors.text }]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 34,
    paddingHorizontal: 4,
    borderBottomWidth: 0.633,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  tabText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  tabCount: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  underline: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    height: 1.5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
});
