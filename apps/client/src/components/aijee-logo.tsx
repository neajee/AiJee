import type React from "react";
// The adaptive-icon monochrome asset is a 1024² canvas where the mark only
// occupies the middle ~61% (alpha bbox 200..823). Scaling the box by this
// factor makes the *rendered mark* match the requested optical size instead of
// the padded canvas.
const CANVAS_TO_MARK = 1 / 0.61;
const MARK = "/android-icon-monochrome.png";
interface AiJeeLogoProps {
  /** Optical size of the mark itself, not the padded asset canvas. */
  size?: number;
  /** Tint applied to the monochrome mark. Omit to keep the asset as-is. */
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}
export function AiJeeLogo({
  size = 56,
  color,
  opacity = 1,
  style
}: AiJeeLogoProps) {
  const box = Math.round(size * CANVAS_TO_MARK);
  return <img src={MARK} alt="AiJee" className="object-contain" style={{ width: box, height: box, opacity, ...style }} />;
}
