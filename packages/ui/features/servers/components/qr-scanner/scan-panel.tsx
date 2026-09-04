import type { ComponentType } from "react";

export interface QrScannerScanPanelProps {
  visible: boolean;
  scanned: boolean;
  isDark: boolean;
  textMuted: string;
  onBarcodeData: (data: string) => void;
}

type NativeScanPanelModule = {
  QrScannerScanPanel: ComponentType<QrScannerScanPanelProps>;
};

type WebScanPanelModule = {
  QrScannerScanPanel: ComponentType<Pick<QrScannerScanPanelProps, "textMuted">>;
};

const nativeModule = require("./scan-panel.native") as NativeScanPanelModule;
const webModule = require("./scan-panel.web") as WebScanPanelModule;

export function QrScannerScanPanel(props: QrScannerScanPanelProps) {
  if (process.env.EXPO_OS === "web") {
    const WebScanPanel = webModule.QrScannerScanPanel;
    return <WebScanPanel textMuted={props.textMuted} />;
  }

  const NativeScanPanel = nativeModule.QrScannerScanPanel;
  return <NativeScanPanel {...props} />;
}
