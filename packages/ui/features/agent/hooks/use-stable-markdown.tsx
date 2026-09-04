import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import { lexer, type Token } from "marked";
import type { useMarkdownHookOptions } from "react-native-marked";
import { Renderer } from "react-native-marked";
import type { ReactNode } from "react";
import type { TextStyle, ViewStyle } from "react-native";
import { MarkdownCodeBlock } from "../components/message-list/markdown-code-block";
import { MarkdownTable } from "../components/message-list/markdown-table";

interface ParserLike {
  parse(tokens?: Token[]): ReactNode[];
}

class StableRenderer extends Renderer {
  constructor(
    private readonly blockCodeTextStyle: TextStyle | undefined,
    private readonly isDark: boolean,
  ) {
    super();
  }

  override code(
    text: string,
    language?: string,
    containerStyle?: ViewStyle,
  ): ReactNode {
    return (
      <MarkdownCodeBlock
        key={`code-${language ?? "plain"}-${text.length}`}
        code={text}
        language={language}
        isDark={this.isDark}
      />
    );
  }

  /**
   * The stock table sizes columns off the window width, which overflows the
   * message column. This one measures against the container instead.
   */
  override table(
    header: ReactNode[][],
    rows: ReactNode[][][],
  ): ReactNode {
    return (
      <MarkdownTable
        key={this.getKey()}
        header={header}
        rows={rows}
        isDark={this.isDark}
      />
    );
  }
}

interface ParserConstructor {
  new (options: {
    styles: Record<string, unknown>;
    baseUrl?: string;
    renderer: Renderer;
  }): ParserLike;
}

let CachedParserClass: ParserConstructor | null = null;

function getParserClass(): ParserConstructor {
  if (!CachedParserClass) {
    // Parser is not re-exported from the public API — load from dist.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-marked/dist/commonjs/lib/Parser");
    CachedParserClass = (mod.default ?? mod) as ParserConstructor;
  }
  return CachedParserClass;
}

const THEME_COLORS = {
  light: {
    background: "#ffffff",
    code: "#f6f8fa",
    link: "#0366d6",
    text: "#000000",
    border: "#e1e4e8",
  },
  dark: {
    background: "#0d1117",
    code: "#161b22",
    link: "#58a6ff",
    text: "#c9d1d9",
    border: "#30363d",
  },
} as const;

const DEFAULT_SPACING = { xs: 2, s: 4, m: 8, l: 12 } as const;

function flattenStyle<T extends object>(values: Array<T | null | undefined>): T {
  return Object.assign({}, ...values.filter((value): value is T => value != null));
}

function buildStyles(
  userStyles: useMarkdownHookOptions["styles"],
  colorScheme: useMarkdownHookOptions["colorScheme"],
  userTheme: useMarkdownHookOptions["theme"],
): Record<string, unknown> {
  const scheme = colorScheme === "dark" ? "dark" : "light";
  const mdColors = { ...THEME_COLORS[scheme], ...userTheme?.colors };
  const mdSpacing = { ...DEFAULT_SPACING, ...userTheme?.spacing };

  const fontRegular = { fontSize: 16, lineHeight: 24, color: mdColors.text };
  const fontHeading = { fontWeight: "500" as const, color: mdColors.text };

  return {
    em: flattenStyle([fontRegular, { fontStyle: "italic" as const }, userStyles?.em]),
    strong: flattenStyle([fontRegular, { fontWeight: "600" as const }, userStyles?.strong]),
    strikethrough: flattenStyle([
      fontRegular,
      { textDecorationLine: "line-through" as const, textDecorationStyle: "solid" as const },
      userStyles?.strikethrough,
    ]),
    text: flattenStyle([fontRegular, userStyles?.text]),
    paragraph: flattenStyle([{ paddingTop: mdSpacing.m , paddingBottom: mdSpacing.m }, userStyles?.paragraph]),
    link: flattenStyle([
      fontRegular,
      { fontStyle: "italic" as const, color: mdColors.link },
      userStyles?.link,
    ]),
    blockquote: flattenStyle([
      {
        borderLeftColor: mdColors.border,
        paddingLeft: mdSpacing.l,
        borderLeftWidth: mdSpacing.s,
        opacity: 0.8,
      },
      userStyles?.blockquote,
    ]),
    h1: flattenStyle([
      fontHeading,
      {
        fontSize: 32, lineHeight: 40, fontWeight: "600" as const,
        marginTop: mdSpacing.m, marginBottom: mdSpacing.m, letterSpacing: 0,
        paddingBottom: mdSpacing.s, borderBottomColor: mdColors.border, borderBottomWidth: 1,
      },
      userStyles?.h1,
    ]),
    h2: flattenStyle([
      fontHeading,
      {
        fontSize: 28, lineHeight: 36, marginTop: mdSpacing.m, marginBottom: mdSpacing.m,
        paddingBottom: mdSpacing.s, borderBottomColor: mdColors.border, borderBottomWidth: 1,
      },
      userStyles?.h2,
    ]),
    h3: flattenStyle([
      fontHeading,
      { fontSize: 24, lineHeight: 32, marginTop: mdSpacing.s , marginBottom: mdSpacing.s },
      userStyles?.h3,
    ]),
    h4: flattenStyle([
      fontHeading,
      { fontSize: 22, lineHeight: 28, marginTop: mdSpacing.s , marginBottom: mdSpacing.s },
      userStyles?.h4,
    ]),
    h5: flattenStyle([fontRegular, fontHeading, { marginTop: mdSpacing.xs , marginBottom: mdSpacing.xs }, userStyles?.h5]),
    h6: flattenStyle([
      fontHeading,
      { fontSize: 14, lineHeight: 20, marginTop: mdSpacing.xs , marginBottom: mdSpacing.xs },
      userStyles?.h6,
    ]),
    codespan: flattenStyle([
      fontRegular,
      { fontStyle: "italic" as const, fontWeight: "300" as const },
      userStyles?.codespan,
    ]),
    code: flattenStyle([
      { padding: mdSpacing.l, backgroundColor: mdColors.code, minWidth: "100%" as const },
      userStyles?.code,
    ]),
    hr: flattenStyle([
      { borderBottomWidth: 1, borderBottomColor: mdColors.border, marginTop: mdSpacing.s , marginBottom: mdSpacing.s },
      userStyles?.hr,
    ]),
    list: flattenStyle([userStyles?.list]),
    li: flattenStyle([fontRegular, { flexShrink: 1 }, userStyles?.li]),
    image: flattenStyle([{ resizeMode: "cover" as const }, userStyles?.image]),
    table: flattenStyle([{ borderWidth: 1, borderColor: mdColors.border }, userStyles?.table]),
    tableRow: flattenStyle([{ flexDirection: "row" as const }, userStyles?.tableRow]),
    tableCell: flattenStyle([{ padding: mdSpacing.s }, userStyles?.tableCell]),
  } as const;
}

const STREAMING_THROTTLE_MS = 100;

/**
 * A drop-in replacement for `useMarkdown` from react-native-marked that:
 *
 * 1. **Resets the Renderer's internal slugger before every parse** so React
 *    keys are deterministic across re-renders (the stock hook lets the slugger
 *    accumulate, producing new keys on every parse → full unmount/remount).
 *
 * 2. **Throttles text updates while streaming** so the expensive markdown
 *    lexer + parser only runs at most once every STREAMING_THROTTLE_MS
 *    instead of on every single text delta (10-50 per second).
 */
export function useStableMarkdown(
  text: string,
  options: useMarkdownHookOptions,
  isStreaming?: boolean,
): JSX.Element[] {
  const textRef = useRef(text);
  textRef.current = text;

  const [throttledText, setThrottledText] = useState(text);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateThrottledText = useCallback((nextText: string, urgent = false) => {
    if (urgent) {
      setThrottledText(nextText);
      return;
    }
    startTransition(() => {
      setThrottledText(nextText);
    });
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = false;
      updateThrottledText(text, true);
      return;
    }

    if (timerRef.current) {
      pendingRef.current = true;
      return;
    }

    updateThrottledText(text);

    timerRef.current = setTimeout(function tick() {
      timerRef.current = null;
      if (pendingRef.current) {
        pendingRef.current = false;
        updateThrottledText(textRef.current);
        timerRef.current = setTimeout(tick, STREAMING_THROTTLE_MS);
      }
    }, STREAMING_THROTTLE_MS);
  }, [text, isStreaming, updateThrottledText]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // --- Markdown parsing with stable keys ------------------------------------
  const styles = useMemo(
    () => buildStyles(options.styles, options.colorScheme, options.theme),
    [options.styles, options.colorScheme, options.theme],
  );
  const deferredText = useDeferredValue(throttledText);
  const markdownSource = isStreaming ? deferredText : throttledText;

  const Parser = getParserClass();

  const elements = useMemo(() => {
    const blockCodeTextStyle = flattenStyle([
      styles.text as TextStyle,
      styles.codespan as TextStyle,
      {
        fontStyle: "normal" as const,
        fontWeight: "400" as const,
        padding: 0,
        backgroundColor: "transparent",
      },
    ]) as TextStyle;
    const renderer = new StableRenderer(blockCodeTextStyle, options.colorScheme === "dark");
    const parser = new Parser({ styles, baseUrl: options.baseUrl, renderer });
    const tokens = lexer(markdownSource, {
      gfm: true,
      tokenizer: options.tokenizer,
    });
    return parser.parse(tokens) as JSX.Element[];
  }, [markdownSource, styles, options.baseUrl, options.tokenizer, Parser]);

  return elements;
}
