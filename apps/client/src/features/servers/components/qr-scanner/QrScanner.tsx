import { AlertCircle, Check, Wifi, X } from 'lucide-react';
import { AppModal } from '@/components/ui';
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
  if (step === 'pairing') return <AppModal visible={visible} onClose={handleClose} title="Connecting to AiJee"><div className="flex flex-col items-center gap-3 py-6 text-center"><span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" /><p className="text-sm">Completing secure pairing…</p><button className="rounded-md px-3 py-2 text-sm hover:bg-hover" onClick={handleClose}>Cancel</button></div></AppModal>;
  if (step === 'done') return <AppModal visible={visible} onClose={handleClose}><div className="flex flex-col items-center gap-3 py-8 text-center"><Check size={36} className="text-success" strokeWidth={2.5} /><h2 className="text-lg font-semibold">Connected</h2></div></AppModal>;
  if (step === 'error') return <AppModal visible={visible} onClose={handleClose} title="Pairing Failed"><div className="flex flex-col gap-4"><div className="flex items-center gap-3 text-error"><AlertCircle size={24} /><span className="text-sm">{error}</span></div><div className="flex justify-end gap-2"><button className="rounded-md px-3 py-2 text-sm hover:bg-hover" onClick={reset}>Try Again</button><button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-content" onClick={handleClose}>Cancel</button></div></div></AppModal>;
  if (step === 'pick-ip' && connectParams) return <AppModal visible={visible} onClose={handleClose} title="Select Network" showClose><div className="flex flex-col gap-3"><p className="text-sm text-muted-foreground">{connectParams.hostname ? `"${connectParams.hostname}" is available on multiple addresses:` : 'Multiple addresses found:'}</p><div className="flex flex-col gap-1">{connectParams.ips.map(ip => <button className="flex items-center gap-3 rounded-md p-3 text-left hover:bg-hover" key={ip} onClick={() => handleSelectIp(ip)}><Wifi size={16} /><span><span className="block text-sm">{ip}</span><span className="block text-xs text-muted-foreground">Port {connectParams.port}</span></span></button>)}</div></div></AppModal>;
  return <AppModal visible={visible} onClose={handleClose} title="Scan QR Code" showClose><div className="flex flex-col gap-5"><QrScannerScanPanel visible={visible} scanned={scanned} isDark={isDark} textMuted={textMuted} onBarcodeData={handleBarCodeScanned} /><div className="flex flex-col gap-2"><span className="text-sm font-medium">Paste connect URL</span><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-md border border-border bg-muted px-3 py-2 text-sm outline-none focus:border-primary" value={manualUrl} onChange={event => handleManualUrlChange(event.target.value)} placeholder="http://设备地址/?k=授权码" /><button onClick={handleManualSubmit} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-content disabled:opacity-40" disabled={!manualUrl.trim()}>Connect</button></div></div>{error && <p className="text-sm text-error">{error}</p>}</div></AppModal>;
}
