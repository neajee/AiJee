import { useCallback, useState } from 'react';

import { useAuthStore } from '@/features/auth/store';
import { useServersStore } from '@/features/servers/store';
import {
  buildServerAddress,
  parseConnectUrl,
  type ConnectParams,
} from '../utils/parse-connect-url';
import type { QrScannerProps, QrScannerControllerState, QrScannerStep } from '../components/qr-scanner/types';

export function useQrScannerController({ visible, onClose }: Pick<QrScannerProps, 'visible' | 'onClose'>): QrScannerControllerState {
  const [scanned, setScanned] = useState(false);
  const [connectParams, setConnectParams] = useState<ConnectParams | null>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<QrScannerStep>('scan');

  const reset = useCallback(() => {
    setScanned(false);
    setConnectParams(null);
    setError(null);
    setManualUrl('');
    setStep('scan');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const doPair = useCallback(async (params: ConnectParams, ip: string) => {
    const address = buildServerAddress(ip, params.port);
    const serverId = params.serverId ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const existingServer = useServersStore.getState().servers.find((server) => server.id === serverId);
    setStep('pairing');
    setError(null);

    if (!params.code) {
      setStep('error');
      setError('授权码无效，请在设备端刷新后重试。');
      return;
    }
    const result = await useAuthStore
      .getState()
      .authorizeWithCode(address, params.code, serverId, params.hostname || ip);
    if (result.success) {
      setStep('done');
      setTimeout(async () => {
        await useServersStore.getState().addServer({
          id: serverId,
          name: existingServer?.name || params.hostname || ip,
          address,
        });
        reset();
        onClose();
      }, 800);
    } else {
      setStep('error');
      setError(result.error ?? 'Pairing failed');
    }
  }, [onClose, reset]);

  const handleScanned = useCallback((data: string) => {
    const params = parseConnectUrl(data);
    if (!params) {
      setError(
        /^exp(s)?:\/\//i.test(data.trim())
          ? '这是 Expo 开发二维码，请扫描 AiJee 设备端生成的授权二维码。'
          : '授权码格式无效，请扫描 AiJee 设备端生成的授权二维码。',
      );
      setScanned(false);
      return;
    }
    setConnectParams(params);
    if (params.ips.length === 1) {
      void doPair(params, params.ips[0]);
    } else {
      setStep('pick-ip');
    }
  }, [doPair]);

  const handleBarCodeScanned = useCallback((data: string) => {
    if (scanned) return;
    setScanned(true);
    setError(null);
    handleScanned(data);
  }, [handleScanned, scanned]);

  const handleManualSubmit = useCallback(() => {
    const trimmed = manualUrl.trim();
    if (!trimmed) return;
    setScanned(true);
    handleScanned(trimmed);
  }, [handleScanned, manualUrl]);

  const handleManualUrlChange = useCallback((value: string) => {
    setManualUrl(value);
    setError(null);
  }, []);

  const handleSelectIp = useCallback((ip: string) => {
    if (connectParams) void doPair(connectParams, ip);
  }, [connectParams, doPair]);

  return {
    step,
    scanned,
    connectParams,
    manualUrl,
    error,
    setManualUrl,
    handleManualUrlChange,
    reset,
    handleClose,
    handleBarCodeScanned,
    handleManualSubmit,
    handleSelectIp,
  };
}
