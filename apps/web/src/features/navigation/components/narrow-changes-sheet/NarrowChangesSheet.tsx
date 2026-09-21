import { AppSheet } from "@/components/ui";
import { ChangesPanel } from "@/features/workspace/components/changes-panel";
import { useSheetHeight } from "../../hooks/use-sheet-height";
interface NarrowChangesSheetProps {
  visible: boolean;
  onClose: () => void;
}
export function NarrowChangesSheet({
  visible,
  onClose
}: NarrowChangesSheetProps) {
  const sheetHeight = useSheetHeight({
    fraction: 0.68,
    min: 420,
    max: 560
  });
  if (!visible) return null;
  return <AppSheet visible={visible} onClose={onClose} title="Changes" height={sheetHeight}>
    <ChangesPanel />
  </AppSheet>;
}
