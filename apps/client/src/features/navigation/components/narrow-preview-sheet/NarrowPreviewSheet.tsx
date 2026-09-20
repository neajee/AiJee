import { AppSheet } from "@/components/ui";
import { PreviewPanel } from "@/features/preview/components/preview-panel";
import { useSheetHeight } from "../../hooks/use-sheet-height";
interface NarrowPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
  sessionId: string | null;
}
export function NarrowPreviewSheet({
  visible,
  onClose,
  sessionId
}: NarrowPreviewSheetProps) {
  const sheetHeight = useSheetHeight({
    fraction: 0.68,
    min: 420,
    max: 560
  });
  if (!visible) return null;
  return <AppSheet visible={visible} onClose={onClose} title="Preview" height={sheetHeight}>
    <PreviewPanel sessionId={sessionId} />
  </AppSheet>;
}
