import { Image, type ImageStyle, type StyleProp } from "react-native";

// The adaptive-icon monochrome asset is a 1024² canvas where the mark only
// occupies the middle ~61% (alpha bbox 200..823). Scaling the box by this
// factor makes the *rendered mark* match the requested optical size instead of
// the padded canvas.
const CANVAS_TO_MARK = 1 / 0.61;

const MARK = require("../assets/images/android-icon-monochrome.png");

interface AiJeeLogoProps {
  /** Optical size of the mark itself, not the padded asset canvas. */
  size?: number;
  /** Tint applied to the monochrome mark. Omit to keep the asset as-is. */
  color?: string;
  opacity?: number;
  style?: StyleProp<ImageStyle>;
}

export function AiJeeLogo({
  size = 56,
  color,
  opacity = 1,
  style,
}: AiJeeLogoProps) {
  const box = Math.round(size * CANVAS_TO_MARK);

  return (
    <Image
      source={MARK}
      // `tintColor` as a prop (not a style) is the form supported on both
      // react-native and react-native-web 0.21.
      tintColor={color}
      resizeMode="contain"
      style={[{ width: box, height: box, opacity }, style]}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}
