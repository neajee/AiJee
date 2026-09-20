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
  return <div className="flex items-center justify-between gap-px px-2 pb-0.5 pt-4">
      <span className="flex-1 text-meta leading-4 font-medium tracking-wide text-text-tertiary">
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
  return <button className="inline-flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-hover" onClick={onClick} disabled={disabled} aria-label={label} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
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
  return <button className={`flex h-[29px] w-full items-center gap-[7px] rounded-md px-[7px] text-left text-[13.5px] leading-[19px] transition-colors hover:bg-hover ${isActive ? 'bg-active font-medium' : ''} ${disabled ? 'opacity-40' : ''}`} onClick={onClick} disabled={disabled} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
      <span className="flex size-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">
        {label}
      </span>
    </button>;
}
