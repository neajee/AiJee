import { Fonts } from "@/constants/theme";
import type { ThemeTokens } from "@/constants/theme";
import type { useMarkdownHookOptions } from "react-native-marked";

type MarkdownTheme = NonNullable<useMarkdownHookOptions["theme"]>;
type MarkdownStyles = NonNullable<useMarkdownHookOptions["styles"]>;

function createTheme(colors: {
  text: string;
  link: string;
  border: string;
  code: string;
}): MarkdownTheme {
  return {
    colors: {
      background: "transparent",
      text: colors.text,
      link: colors.link,
      border: colors.border,
      code: colors.code,
    },
    spacing: {
      xs: 2,
      s: 4,
      m: 8,
      l: 12,
    },
  };
}

function createStyles(colors: {
  text: string;
  textStrong: string;
  textMuted: string;
  link: string;
  border: string;
  code: string;
  codeText: string;
  baseFontSize?: number;
  codeFontSize?: number;
}): MarkdownStyles {
  const baseFontSize = colors.baseFontSize ?? 14;
  const codeFontSize = colors.codeFontSize ?? 13;
  return {
    text: {
      fontSize: baseFontSize,
      lineHeight: 22,
      fontFamily: Fonts.sans,
      color: colors.text,
    },
    h1: {
      fontSize: 18,
      lineHeight: 26,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    h2: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    h3: {
      fontSize: 15,
      lineHeight: 23,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    h4: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    h5: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    h6: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sansMedium,
      fontWeight: "600",
      color: colors.textStrong,
    },
    paragraph: {
      paddingVertical: 4,
    },
    strong: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sansSemiBold,
      fontWeight: "600",
      color: colors.textStrong,
    },
    em: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sansItalic,
      fontStyle: "italic",
    },
    strikethrough: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sans,
      textDecorationLine: "line-through",
      color: colors.textMuted,
    },
    link: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sans,
      fontStyle: "normal",
      color: colors.link,
    },
    codespan: {
      fontFamily: Fonts.mono,
      fontStyle: "normal",
      fontSize: codeFontSize,
      lineHeight: 20,
      color: colors.codeText,
      backgroundColor: colors.code,
    },
    code: {
      backgroundColor: colors.code,
      borderRadius: 8,
      padding: 12,
    },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
    list: {
      gap: 2,
    },
    li: {
      fontSize: 14,
      lineHeight: 22,
      fontFamily: Fonts.sans,
      color: colors.text,
    },
    hr: {
      marginVertical: 8,
      height: 1,
      backgroundColor: colors.border,
    },
    table: {
      borderColor: colors.border,
    },
    tableRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableCell: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
  };
}

export const markedDarkOptions: useMarkdownHookOptions = {
  colorScheme: "dark",
  theme: createTheme({
    text: "#CCCCCC",
    link: "#58a6ff",
    border: "#2A2A2A",
    code: "#1A1A1A",
  }),
  styles: createStyles({
    text: "#CCCCCC",
    textStrong: "#E8E8E8",
    textMuted: "#999999",
    link: "#58a6ff",
    border: "#333333",
    code: "#1A1A1A",
    codeText: "#c9d1d9",
  }),
};

export const markedLightOptions: useMarkdownHookOptions = {
  colorScheme: "light",
  theme: createTheme({
    text: "#1A1A1A",
    link: "#0366d6",
    border: "#E8E8E8",
    code: "#F6F6F6",
  }),
  styles: createStyles({
    text: "#1A1A1A",
    textStrong: "#1A1A1A",
    textMuted: "#666666",
    link: "#0366d6",
    border: "#DDDDDD",
    code: "#F6F6F6",
    codeText: "#24292e",
  }),
};

export function createMarkedOptions(tokens: ThemeTokens, scheme: 'light' | 'dark', codeFontSize = 13): useMarkdownHookOptions {
  return {
    colorScheme: scheme,
    theme: createTheme({ text: tokens.text, link: tokens.accent, border: tokens.border, code: tokens.code }),
    styles: createStyles({
      text: tokens.text,
      textStrong: tokens.text,
      textMuted: tokens.textTertiary,
      link: tokens.accent,
      border: tokens.border,
      code: tokens.code,
      codeText: tokens.codeText,
      codeFontSize,
    }),
  };
}
