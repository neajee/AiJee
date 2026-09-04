import { Text as TamaguiText } from 'tamagui';
import { type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <TamaguiText
      style={[
        { color },
        typeStyles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const typeStyles = {
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
    textAlign: 'left',
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sansSemiBold,
    textAlign: 'left',
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.sansBold,
    lineHeight: 32,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: Fonts.sansBold,
    textAlign: 'left',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: Fonts.sans,
    color: '#0a7ea4',
    textAlign: 'left',
  },
} as const;
