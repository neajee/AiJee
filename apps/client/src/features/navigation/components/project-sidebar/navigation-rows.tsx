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
  return <div className="flex flex-col">
      <span className={"  text-text-tertiary"}>
        {title}
      </span>
      {actions}
    </div>;
}
export function HeaderAction({
  onClick,
  label,
  disabled,
  children,
  isDark
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  return <button onClick={onClick} disabled={disabled} aria-label={label} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      {children}
    </button>;
}

/** A flat icon + label row, used for the actions above and below the list. */
export function SidebarRow({
  icon,
  label,
  onClick,
  isActive = false,
  disabled = false,
  isDark
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  isDark: boolean;
}) {
  const colors = useThemeTokens();
  const [hovered, setHovered] = useState(false);
  const hoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.035)";
  const activeBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  return <button onClick={onClick} disabled={disabled} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <div className="flex flex-col">{icon}</div>
      <span>
        {label}
      </span>
    </button>;
}
