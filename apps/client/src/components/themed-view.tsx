import type React from "react";
import { useThemeColor } from '@/hooks/use-theme-color';
export type ThemedViewProps = React.HTMLAttributes<HTMLDivElement> & {
  lightColor?: string;
  darkColor?: string;
};
export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({
    light: lightColor,
    dark: darkColor
  }, 'background');
  return <div {...otherProps} />;
}
