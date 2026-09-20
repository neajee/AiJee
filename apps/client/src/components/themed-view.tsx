import { type ViewProps } from "@/types/dom";
import { useThemeColor } from '@/hooks/use-theme-color';
export type ThemedViewProps = ViewProps & {
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
  return <div className={"" + " " + ""} {...otherProps} />;
}
