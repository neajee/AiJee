import { memo, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ChangesPanel } from "@/features/workspace/components/changes-panel";
import { PreviewPanel } from "@/features/preview/components/preview-panel";
import { usePreviewStore } from "@/features/preview/store";

interface WorkspaceRightPaneProps {
  sessionId: string | null;
}

const PREVIEW_TAB = [{ key: "preview", label: "Preview" }];

/**
 * The right pane.
 *
 * Preview is contributed to the card's own tab row rather than wrapped in a
 * second one, so Git, Files and Preview all switch from the same line.
 */
function WorkspaceRightPaneComponent({ sessionId }: WorkspaceRightPaneProps) {
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";
  const isDesktopShell =
    typeof navigator !== "undefined" && navigator.userAgent.includes("AiJeeDesktop/");
  const previewPaneOpen = usePreviewStore((state) =>
    sessionId ? state.paneOpenBySession[sessionId] ?? false : false,
  );
  const setPreviewPaneOpen = usePreviewStore((state) => state.setPaneOpen);
  const [previewActive, setPreviewActive] = useState(false);

  useEffect(() => {
    setPreviewActive(previewPaneOpen);
  }, [previewPaneOpen]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#151515" : "#FAFAFA" },
      ]}
    >
      <ChangesPanel
        extraTabs={isDesktopShell ? PREVIEW_TAB : undefined}
        activeExtraTab={isDesktopShell && previewActive ? "preview" : null}
        onExtraTabChange={isDesktopShell ? (key) => {
          const open = key === "preview";
          setPreviewActive(open);
          if (sessionId) setPreviewPaneOpen(sessionId, open);
        } : undefined}
        renderExtraTab={isDesktopShell ? () => <PreviewPanel sessionId={sessionId} /> : undefined}
      />
    </View>
  );
}

export const WorkspaceRightPane = memo(WorkspaceRightPaneComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
