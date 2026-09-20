import { AlertCircle, Check, Wifi, X } from 'lucide-react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QrScannerScanPanel } from './scan-panel';
import { useQrScannerController } from '../../hooks/use-qr-scanner-controller';
import type { QrScannerProps } from './component-types';
export function QrScanner({
  visible,
  onClose
}: QrScannerProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const textPrimary = isDark ? '#fefdfd' : '#1a1a1a';
  const textMuted = isDark ? '#cdc8c5' : '#888';
  const cardBg = isDark ? '#1e1e1e' : '#FFFFFF';
  const borderColor = isDark ? '#3b3a39' : 'rgba(0,0,0,0.08)';
  const inputBg = isDark ? '#2a2a2a' : '#F6F6F6';
  const {
    step,
    scanned,
    connectParams,
    manualUrl,
    error,
    handleManualUrlChange,
    reset,
    handleClose,
    handleBarCodeScanned,
    handleManualSubmit,
    handleSelectIp
  } = useQrScannerController({
    visible,
    onClose
  });
  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)';
  const modalProps = {
    visible,
    transparent: true as const,
    onRequestClose: handleClose
  };
  if (step === 'pairing') {
    return <div {...modalProps} animationType="fade">
        <button onClick={handleClose} aria-label="关闭配对弹窗">
          <button onClick={event => event.stopPropagation()}>
            <div className="flex flex-col">
              <span className="size-3 animate-spin" />
              <span>Connecting to AiJee</span>
              <span>Completing secure pairing…</span>
            </div>
            <button onClick={handleClose}>
              <span>Cancel</span>
            </button>
          </button>
        </button>
      </div>;
  }
  if (step === 'done') {
    return <div {...modalProps} animationType="fade">
        <button onClick={handleClose} aria-label="关闭配对成功弹窗">
          <button onClick={event => event.stopPropagation()}>
            <div className="flex flex-col">
              <div>
                <Check size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <span>Connected</span>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'error') {
    return <div {...modalProps} animationType="fade">
        <button onClick={handleClose} aria-label="关闭配对失败弹窗">
          <button onClick={event => event.stopPropagation()}>
            <div className="flex flex-col">
              <div>
                <AlertCircle size={28} color="#fff" strokeWidth={2} />
              </div>
              <span>Pairing Failed</span>
              <span>{error}</span>
            </div>
            <div className="flex flex-col">
              <button onClick={reset}>
                <span>Try Again</span>
              </button>
              <button onClick={handleClose}>
                <span>Cancel</span>
              </button>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'pick-ip' && connectParams) {
    return <div {...modalProps} animationType="fade">
        <button onClick={handleClose} aria-label="关闭网络选择弹窗">
          <button onClick={event => event.stopPropagation()}>
            <div className="flex flex-col">
              <span>Select Network</span>
              <button onClick={handleClose} className="inline-flex items-center">
                <X size={18} color={textMuted} strokeWidth={1.8} />
              </button>
            </div>
            <span>
              {connectParams.hostname ? `"${connectParams.hostname}" is available on multiple addresses:` : 'Multiple addresses found:'}
            </span>
            <div className="flex flex-col">
              {connectParams.ips.map(ip => <button key={ip} onClick={() => handleSelectIp(ip)}>
                  <Wifi size={16} color={textMuted} strokeWidth={1.8} />
                  <div className="flex flex-col">
                    <span>{ip}</span>
                    <span>Port {connectParams.port}</span>
                  </div>
                </button>)}
            </div>
          </button>
        </button>
      </div>;
  }
  return <div {...modalProps} animationType="fade">
      <button onClick={handleClose} aria-label="关闭扫码弹窗">
        <button onClick={event => event.stopPropagation()}>
          <div className="flex flex-col">
            <span>Scan QR Code</span>
            <button onClick={handleClose} className="inline-flex items-center">
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </button>
          </div>
          <QrScannerScanPanel visible={visible} scanned={scanned} isDark={isDark} textMuted={textMuted} onBarcodeData={handleBarCodeScanned} />
          <div className="flex flex-col">
            <span>
              {true ? 'Paste connect URL' : 'Or paste URL manually'}
            </span>
            <div className="flex flex-col">
              <input value={manualUrl} onChange={event => handleManualUrlChange(event.target.value)} placeholder="http://设备地址/?k=授权码" />
              <button onClick={handleManualSubmit} className={"  opacity-[0.4]"} disabled={!manualUrl.trim()}>
                <span>Connect</span>
              </button>
            </div>
          </div>
          {error && <span>{error}</span>}
        </button>
      </button>
    </div>;
}
