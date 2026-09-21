import { useState } from "react";
import Svg, { Circle as SvgCircle } from "@/platform/svg";
function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}
export function ContextUsageRing({
  used,
  total,
  isDark
}: {
  used: number;
  total: number;
  isDark: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  // Matches the h-7 pickers beside it so its bottom lines up with the "Auto"
  // control, with a smaller mark so it reads as a status, not a button.
  const size = 16;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * ratio;
  const trackColor = isDark ? "#2A2A2A" : "#E5E5E5";
  const fillColor = isDark ? "#555" : "#AAA";
  const free = Math.max(total - used, 0);
  const pct = Math.round(ratio * 100);
  return <div className="relative mr-2 flex items-center">
      <button onClick={() => setShowTooltip(v => !v)} role="button" aria-label={`Context usage ${pct}%`} aria-expanded={showTooltip} className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-hover">
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={stroke} fill="none" />
          {ratio > 0 && <SvgCircle cx={size / 2} cy={size / 2} r={radius} stroke={fillColor} strokeWidth={stroke} fill="none" strokeDasharray={`${filled} ${circumference - filled}`} strokeDashoffset={circumference * 0.25} strokeLinecap="round" />}
        </Svg>
      </button>
      {showTooltip && <div role="tooltip" className="absolute bottom-full right-0 z-40 mb-1.5 flex w-max flex-col gap-0.5 rounded-md border border-border bg-card px-2.5 py-1.5 shadow-lg">
          <span className="text-caption font-medium text-foreground">
            Context · {pct}%
          </span>
          <span className="text-caption text-text-secondary">
            Used {formatTokens(used)} of {formatTokens(total)}
          </span>
          <span className="text-caption text-text-tertiary">
            Free {formatTokens(free)}
          </span>
        </div>}
    </div>;
}
