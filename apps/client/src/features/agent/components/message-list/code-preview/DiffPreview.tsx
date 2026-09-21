import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Columns2, Maximize2, Rows2, X } from "lucide-react";
import { useThemeTokens } from "@/hooks/use-theme-tokens";

/**
 * react-diff-viewer-continued is a large, editor-adjacent dependency and only
 * tool calls that changed a file need it, so it loads on demand rather than with
 * the conversation.
 */
const ReactDiffViewer = lazy(() =>
  import("react-diff-viewer-continued").then(module => ({ default: module.default }))
);

/** Our short language ids mapped to the Prism/refractor names the viewer wants. */
const PRISM_LANGUAGE: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  jsx: "jsx",
  js: "javascript",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  py: "python",
  sh: "bash",
  bash: "bash",
  html: "markup",
  htm: "markup",
  xml: "markup",
  svg: "markup"
};

function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

export interface DiffPreviewProps {
  oldValue: string;
  newValue: string;
  isDark: boolean;
  maxHeight?: number;
  /** Initial layout; the reader can flip it from the toolbar. */
  defaultSplitView?: boolean;
  language?: string;
  title?: string;
  /** Hide the layout/fullscreen toolbar (e.g. inside the fullscreen viewer). */
  controls?: boolean;
}

/**
 * A themed, read-only diff panel with a unified/split toggle and a fullscreen
 * view. Colours come from the app tokens so it reads as part of the app rather
 * than a foreign widget.
 */
export function DiffPreview({
  oldValue,
  newValue,
  isDark,
  maxHeight,
  defaultSplitView = false,
  language,
  title,
  controls = true
}: DiffPreviewProps) {
  const colors = useThemeTokens();
  const [splitView, setSplitView] = useState(defaultSplitView);
  const [fullscreen, setFullscreen] = useState(false);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);
  const variables = useMemo(() => ({
    // Let the panel's own background show through so it matches the code blocks.
    diffViewerBackground: "transparent",
    diffViewerColor: colors.text,
    addedBackground: withAlpha(colors.diffAdded, "24"),
    addedColor: colors.text,
    removedBackground: withAlpha(colors.diffRemoved, "24"),
    removedColor: colors.text,
    wordAddedBackground: withAlpha(colors.diffAdded, "55"),
    wordRemovedBackground: withAlpha(colors.diffRemoved, "55"),
    addedGutterBackground: withAlpha(colors.diffAdded, "33"),
    removedGutterBackground: withAlpha(colors.diffRemoved, "33"),
    gutterBackground: "transparent",
    gutterBackgroundDark: "transparent",
    gutterColor: colors.textTertiary,
    addedGutterColor: colors.diffAdded,
    removedGutterColor: colors.diffRemoved,
    codeFoldGutterBackground: "transparent",
    codeFoldBackground: "transparent",
    codeFoldContentColor: colors.textTertiary,
    emptyLineBackground: "transparent",
    highlightBackground: withAlpha(colors.accent, "22"),
    highlightGutterBackground: withAlpha(colors.accent, "33")
  }), [colors]);
  const viewer = (maxHeightValue?: number, split = splitView) => <Suspense fallback={<div className="p-3 font-mono text-caption text-text-tertiary">Loading diff…</div>}>
      <ReactDiffViewer oldValue={oldValue} newValue={newValue} splitView={split} useDarkTheme={isDark} disableWorker hideSummary showDiffOnly={false} disableWordDiff={false} highlightLanguage={language ? PRISM_LANGUAGE[language] ?? language : undefined} styles={{
      variables: { light: variables, dark: variables },
      diffContainer: { fontSize: "var(--fs-meta)", minWidth: "100%", pre: { lineHeight: "16px" } },
      line: { fontSize: "var(--fs-meta)" },
      contentText: { fontSize: "var(--fs-meta)", lineHeight: "16px", fontFamily: "var(--aijee-code-font-family, ui-monospace, monospace)" }
    }} />
    </Suspense>;
  const toggle = <button onClick={() => setSplitView(value => !value)} className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-meta text-text-tertiary hover:bg-hover hover:text-foreground" role="button" aria-label={splitView ? "Switch to unified view" : "Switch to split view"} title={splitView ? "Unified view" : "Split view"}>
      {splitView ? <Rows2 size={12} strokeWidth={2} /> : <Columns2 size={12} strokeWidth={2} />}
      <span>{splitView ? "Unified" : "Split"}</span>
    </button>;
  const fullscreenButton = <button onClick={() => setFullscreen(true)} className="inline-flex size-6 items-center justify-center rounded text-text-tertiary hover:bg-hover hover:text-foreground" role="button" aria-label="Open diff fullscreen" title="Fullscreen">
      <Maximize2 size={12} strokeWidth={2} />
    </button>;
  return <>
      <div className="overflow-hidden rounded-b-md bg-muted">
        {controls && <div className="flex items-center gap-2 px-2 py-0.5">
            <span className="min-w-0 flex-1 truncate font-mono text-meta text-text-tertiary">{title}</span>
            {toggle}
            {fullscreenButton}
          </div>}
        <div style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>{viewer(maxHeight)}</div>
      </div>
      {fullscreen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-6" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeFullscreen();
        }}>
          <div className="flex h-full max-h-[90vh] w-full max-w-[1200px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl" role="dialog" aria-modal="true" aria-label={title ? `Diff of ${title}` : "Diff"} onMouseDown={event => event.stopPropagation()}>
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-mono text-caption text-text-secondary">{title}</span>
              <button onClick={() => setSplitView(value => !value)} className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-caption text-text-secondary hover:bg-hover" role="button" aria-label={splitView ? "Switch to unified view" : "Switch to split view"}>
                {splitView ? <Rows2 size={13} strokeWidth={2} /> : <Columns2 size={13} strokeWidth={2} />}
                <span>{splitView ? "Unified" : "Split"}</span>
              </button>
              <button onClick={closeFullscreen} className="inline-flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-hover" role="button" aria-label="Close fullscreen diff">
                <X size={15} strokeWidth={2} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">{viewer(undefined, splitView)}</div>
          </div>
        </div>,
        document.body
      )}
    </>;
}
