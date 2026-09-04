import { Text, View } from 'tamagui';
import { useState, type ReactNode } from "react";
import { Pressable } from "react-native";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { styles } from "./styles";
export function SectionHeader({
  title,
  actions,
  isDark,
}: {
  title: string;
  actions?: ReactNode;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
        {title}
      </Text>
      {actions}
    </View>
  );
}

export function HeaderAction({
  onPress,
  label,
  disabled,
  children,
  isDark,
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.headerAction,
        hovered && { backgroundColor: hoverBg },
        pressed && { opacity: 0.6 },
      ]}
    >
      {children}
    </Pressable>
  );
}

/** A flat icon + label row, used for the actions above and below the list. */
export function SidebarRow({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
  isDark,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  disabled?: boolean;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.row,
        isActive
          ? { backgroundColor: activeBg }
          : hovered && { backgroundColor: hoverBg },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text
        style={[
          styles.rowLabel,
          { color: isActive ? colors.text : colors.textSecondary },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
