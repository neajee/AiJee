import type { ConnectParams } from '../../utils/parse-connect-url';

export type QrScannerStep = 'scan' | 'pick-ip' | 'pairing' | 'done' | 'error';

export interface QrScannerProps {
  visible: boolean;
  onClose: () => void;
  onNeedNewWorkspace?: () => void;
}

export interface QrScannerControllerState {
  step: QrScannerStep;
  scanned: boolean;
  connectParams: ConnectParams | null;
  manualUrl: string;
  error: string | null;
  setManualUrl: (value: string) => void;
  handleManualUrlChange: (value: string) => void;
  reset: () => void;
  handleClose: () => void;
  handleBarCodeScanned: (data: string) => void;
  handleManualSubmit: () => void;
  handleSelectIp: (ip: string) => void;
}
