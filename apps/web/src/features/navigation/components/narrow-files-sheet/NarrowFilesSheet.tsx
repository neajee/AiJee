import { AppSheet } from "@/components/ui";
import { FilesPanel } from "@/features/files/components/files-panel/FilesPanel";
import { useSheetHeight } from "../../hooks/use-sheet-height";
interface NarrowFilesSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function NarrowFilesSheet({
  visible,
  onClose
}: NarrowFilesSheetProps) {
  const sheetHeight = useSheetHeight({
    fraction: 0.68,
    min: 420,
    max: 560
  });
  if (!visible) return null;
  return <AppSheet visible={visible} onClose={onClose} title="Files" height={sheetHeight}>
    <FilesPanel />
  </AppSheet>;
}
