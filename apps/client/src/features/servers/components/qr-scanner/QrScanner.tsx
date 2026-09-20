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
        <button className={" "} onClick={handleClose} aria-label="关闭配对弹窗">
          <button className={" "} onClick={event => event.stopPropagation()}>
            <div className={"block"}>
              <span size="large" color={textPrimary} />
              <span className={" "}>Connecting to AiJee</span>
              <span className={" "}>Completing secure pairing…</span>
            </div>
            <button onClick={handleClose} className={" "}>
              <span className={" "}>Cancel</span>
            </button>
          </button>
        </button>
      </div>;
  }
  if (step === 'done') {
    return <div {...modalProps} animationType="fade">
        <button className={" "} onClick={handleClose} aria-label="关闭配对成功弹窗">
          <button className={" "} onClick={event => event.stopPropagation()}>
            <div className={"block"}>
              <div className={" "}>
                <Check size={28} color="#fff" strokeWidth={2.5} />
              </div>
              <span className={" "}>Connected</span>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'error') {
    return <div {...modalProps} animationType="fade">
        <button className={" "} onClick={handleClose} aria-label="关闭配对失败弹窗">
          <button className={" "} onClick={event => event.stopPropagation()}>
            <div className={"block"}>
              <div className={" "}>
                <AlertCircle size={28} color="#fff" strokeWidth={2} />
              </div>
              <span className={" "}>Pairing Failed</span>
              <span className={" "}>{error}</span>
            </div>
            <div className={"block"}>
              <button onClick={reset} className={" "}>
                <span className={" "}>Try Again</span>
              </button>
              <button onClick={handleClose} className={" "}>
                <span className={" "}>Cancel</span>
              </button>
            </div>
          </button>
        </button>
      </div>;
  }
  if (step === 'pick-ip' && connectParams) {
    return <div {...modalProps} animationType="fade">
        <button className={" "} onClick={handleClose} aria-label="关闭网络选择弹窗">
          <button className={" "} onClick={event => event.stopPropagation()}>
            <div className={"block"}>
              <span className={" "}>Select Network</span>
              <button onClick={handleClose} className={"block"}>
                <X size={18} color={textMuted} strokeWidth={1.8} />
              </button>
            </div>
            <span className={" "}>
              {connectParams.hostname ? `"${connectParams.hostname}" is available on multiple addresses:` : 'Multiple addresses found:'}
            </span>
            <div className={"block"}>
              {connectParams.ips.map(ip => <button key={ip} onClick={() => handleSelectIp(ip)}>
                  <Wifi size={16} color={textMuted} strokeWidth={1.8} />
                  <div className={"block"}>
                    <span className={" "}>{ip}</span>
                    <span className={" "}>Port {connectParams.port}</span>
                  </div>
                </button>)}
            </div>
          </button>
        </button>
      </div>;
  }
  return <div {...modalProps} animationType="fade">
      <button className={" "} onClick={handleClose} aria-label="关闭扫码弹窗">
        <button className={" "} onClick={event => event.stopPropagation()}>
          <div className={"block"}>
            <span className={" "}>Scan QR Code</span>
            <button onClick={handleClose} className={"block"}>
              <X size={18} color={textMuted} strokeWidth={1.8} />
            </button>
          </div>
          <QrScannerScanPanel visible={visible} scanned={scanned} isDark={isDark} textMuted={textMuted} onBarcodeData={handleBarCodeScanned} />
          <div className={"block"}>
            <span className={" "}>
              {true ? 'Paste connect URL' : 'Or paste URL manually'}
            </span>
            <div className={"block"}>
              <input className={" "} value={manualUrl} onChangeText={handleManualUrlChange} placeholder="http://设备地址/?k=授权码" placeholderTextColor={isDark ? '#666' : '#bbb'} autoCapitalize="none" autoCorrect={false} />
              <button onClick={handleManualSubmit} className={"  opacity-[0.4]"} disabled={!manualUrl.trim()}>
                <span className={" "}>Connect</span>
              </button>
            </div>
          </div>
          {error && <span className={" "}>{error}</span>}
        </button>
      </button>
    </div>;
}
