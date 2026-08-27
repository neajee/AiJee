import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Search } from "lucide-react-native";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ServerSwitcher } from "@/features/servers/components/server-switcher";
import { CommandPalette } from "../command-palette";

/**
 * The one row above the project list: which server, and search.
 *
 * Collapsing lives on the sidebar's seam instead of in here — a control that
 * hides with the thing it hides leaves no way back.
 */
export function SidebarHeader() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";
  const [paletteVisible, setPaletteVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setPaletteVisible(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const iconColor = isDark ? "#cdc8c5" : colors.textSecondary;
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  return (
    <View style={styles.row}>
      <ServerSwitcher />

      <Pressable
        onPress={() => setPaletteVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Search"
        style={({ pressed, hovered }: any) => [
          styles.iconBtn,
          (pressed || hovered) && { backgroundColor: hoverBg },
        ]}
      >
        <Search size={16} color={iconColor} strokeWidth={1.8} />
      </Pressable>

      <CommandPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingLeft: 6,
    // Clear of the content card's rounded corner, which crowds this edge.
    paddingRight: 12,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  } as any,
});
