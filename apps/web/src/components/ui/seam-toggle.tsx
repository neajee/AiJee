import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

/** Both panel seams size their control from here, so the two stay identical. */
export const SEAM_TOGGLE_WIDTH = 18;
export const SEAM_TOGGLE_HEIGHT = 64;

/** At rest: the same short bar the resize handle uses. */
const REST_WIDTH = 3;
const REST_HEIGHT = 30;
/** Hovered: just enough box to hold the chevron, not a tall empty capsule. */
const ACTIVE_WIDTH = SEAM_TOGGLE_WIDTH;
const ACTIVE_HEIGHT = 38;
interface SeamToggleProps {
  /** Which way the panel moves when pressed. */
  chevron: "left" | "right";
  onClick: () => void;
  label: string;
  /** Web only: lets the pill count as part of the seam's hover target. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}

/**
 * The control that rides a panel seam, centred on it.
 *
 * One shape throughout: at rest it is the seam's own short bar, and on hover
 * that bar thickens into a pill holding the chevron. The chevron fades in only
 * once the bar has widened enough to hold it, so nothing spills out at rest and
 * no second shape appears out of nowhere.
 *
 * The pressable stays full size in both states, so the small resting mark is
 * never what you have to hit.
 */
export function SeamToggle({
  chevron,
  onClick,
  label,
  onPointerEnter,
  onPointerLeave
}: SeamToggleProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = useThemeTokens();
  const isDark = colorScheme === "dark";
  const isWeb = true;
  const [active, setActive] = useState(!isWeb);
  const Chevron = chevron === "left" ? ChevronLeft : ChevronRight;
  const restColor = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)";
  const activeColor = isDark ? "#2a2a2a" : "#ffffff";
  const activeBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";
  const activeShadow = isDark ? "0 1px 3px rgba(0,0,0,0.5)" : "0 1px 2px rgba(0,0,0,0.08)";
  const handleIn = () => {
    if (isWeb) setActive(true);
    onPointerEnter?.();
  };
  const handleOut = () => {
    if (isWeb) setActive(false);
    onPointerLeave?.();
  };
  const webHoverProps = isWeb ? {
    onMouseEnter: handleIn,
    onMouseLeave: handleOut
  } : {};
  return <button onClick={onClick} role="button" aria-label={label} {...{
    title: label
  }} {...webHoverProps}
  // The mark is small; the hit area is the whole seam segment plus slop.
  className="flex h-16 w-[18px] items-center justify-center">
      <div
        className="flex items-center justify-center overflow-hidden rounded-full border border-solid transition-all duration-150 ease-out"
        style={{
          width: active ? ACTIVE_WIDTH : REST_WIDTH,
          height: active ? ACTIVE_HEIGHT : REST_HEIGHT,
          backgroundColor: active ? activeColor : restColor,
          borderColor: active ? activeBorder : "transparent",
          boxShadow: active ? activeShadow : "none"
        }}
      >
        <Chevron
          size={13}
          color={colors.textSecondary}
          strokeWidth={2}
          className={`shrink-0 transition-opacity duration-100 ${active ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    </button>;
}
