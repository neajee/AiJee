import { QrCode } from "lucide-react";
import { Fonts } from "@/constants/theme";
interface QrScannerScanPanelProps {
  visible: boolean;
  scanned: boolean;
  isDark: boolean;
  textMuted: string;
  onBarcodeData: (data: string) => void;
}
export function QrScannerScanPanel({
  textMuted
}: QrScannerScanPanelProps) {
  return <div className="flex flex-col">
      <QrCode size={36} color={textMuted} strokeWidth={1.2} />
      <span>
        Camera scanning is not available on the web client. Paste the connect
        URL manually.
      </span>
    </div>;
}
const styles = {
  permissionWrap: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  permissionText: {
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: "center"
  }
} as const;
