import { useState, type ReactNode } from "react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
export function SectionHeader({
  title,
  actions,
  isDark
}: {
  title: string;
  actions?: ReactNode;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  return <div className={"block"}>
      <span className={"  text-text-tertiary"}>
        {title}
      </span>
      {actions}
    </div>;
}
export function HeaderAction({
  onPress,
  label,
  disabled,
  children,
  isDark
}: {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  return <button onClick={onPress} disabled={disabled} aria-label={label} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      {children}
    </button>;
}

/** A flat icon + label row, used for the actions above and below the list. */
export function SidebarRow({
  icon,
  label,
  onPress,
  isActive = false,
  disabled = false,
  isDark
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
  return <button onClick={onPress} disabled={disabled} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}>
      <div className={"block"}>{icon}</div>
      <span>
        {label}
      </span>
    </button>;
}
