import { memo, type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { AnimatedCollapse } from "../animated-collapse";

/**
 * Single source of truth for how tall an expanded tool result may get. Bodies
 * cap themselves at this height (usually via their own ScrollView), so the
 * surrounding collapse never needs a second, drifting magic number.
 */
export const TOOL_BODY_MAX_HEIGHT = 260;
const CHEVRON_SIZE = 11;
interface ToolHeaderProps {
  expanded: boolean;
  /** When false the row renders inert: no chevron, no press feedback. */
  expandable: boolean;
  onToggle: () => void;
  isDark: boolean;
  "aria-label": string;
  /** Leading glyph so every work row shares one text baseline. */
  icon?: LucideIcon;
  /** Multi-line headers (subagent) need the chevron pinned to the first line. */
  alignTop?: boolean;
  children: ReactNode;
}

/**
 * The tappable summary line of a tool call. Owns the disclosure affordance so
 * every tool gets the same chevron, touch target and press feedback.
 */
export const ToolHeader = memo(function ToolHeader({
  expanded,
  expandable,
  onToggle,
  "aria-label": ariaLabel,
  icon: Icon,
  alignTop = false,
  children
}: ToolHeaderProps) {
  const colors = useThemeTokens();
  const glyph = Icon ? <Icon size={12} strokeWidth={1.8} color={colors.textTertiary} className={`shrink-0 ${alignTop ? 'mt-[3px]' : ''}`} /> : null;
  if (!expandable) {
    return <div className="flex min-h-7 items-center gap-1.5 py-1">{glyph}<div className="min-w-0 flex-1">{children}</div></div>;
  }
  return <button className={`flex min-h-7 w-full items-center justify-between gap-1.5 rounded-md py-1 text-left text-xs hover:bg-hover ${alignTop ? 'items-start' : ''}`} onClick={onToggle} role="button" aria-label={ariaLabel}>
      {glyph}
      <div className="min-w-0 flex-1">{children}</div>
      <ChevronRight className={`shrink-0 transition-transform ${alignTop ? 'mt-[3px]' : ''} ${expanded ? 'rotate-90' : ''}`} size={CHEVRON_SIZE} color={colors.textTertiary} strokeWidth={2} />
    </button>;
});

/**
 * The collapsing region under a tool header. Deliberately has no max height of
 * its own: whatever is inside is responsible for capping itself, which keeps
 * the open/close animation and the scroll cap from fighting each other.
 */
export function ToolBody({
  expanded,
  children
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  return <AnimatedCollapse expanded={expanded}>
      <div className="flex flex-col gap-2 px-2 pb-2">{children}</div>
    </AnimatedCollapse>;
}

/**
 * The panel every tool result sits in. Matches CodePreview's surface so a bash
 * transcript, a diff and a subagent log all read as the same kind of object.
 */
export function ToolSurface({
  padded = true,
  children
}: {
  isDark: boolean;
  padded?: boolean;
  children: ReactNode;
}) {
  return <div className={`overflow-hidden rounded-b-md bg-muted ${padded ? 'p-2.5' : ''}`}>
      {children}
    </div>;
}
