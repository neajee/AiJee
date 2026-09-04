import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useConnection } from '@aijee/client-sdk';
import type { ConnectionStatusBannerViewProps } from '../components/connection-status-banner/types';

export function useConnectionStatusController(): ConnectionStatusBannerViewProps & { mounted: boolean } {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { reconnect, ...connection } = useConnection();
  const alertMessage: string | null = null;
  const hasConnectionIssue = connection.status === 'reconnecting' || connection.status === 'disconnected';
  const visible = hasConnectionIssue || !!alertMessage;
  const isReconnecting = connection.status === 'reconnecting';
  const [mounted, setMounted] = useState(visible);
  const [now, setNow] = useState(() => Date.now());
  const heightAnim = useRef(new Animated.Value(0)).current;
  const bottomPad = Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 6);
  const isCompact = width < 420;
  const stripHeight = (isCompact ? 84 : 54) + bottomPad;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(heightAnim, { toValue: stripHeight, duration: 200, useNativeDriver: false }).start();
    } else {
      Animated.timing(heightAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [heightAnim, visible, stripHeight]);

  useEffect(() => {
    if (!isReconnecting || !connection.nextRetryAt) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [connection.nextRetryAt, isReconnecting]);

  const handleTap = useCallback(() => {
    if (hasConnectionIssue) reconnect();
  }, [hasConnectionIssue, reconnect]);

  const retryDelayMs = connection.nextRetryAt !== null ? connection.nextRetryAt - now : null;
  const isWaitingToRetry = isReconnecting && retryDelayMs !== null && retryDelayMs > 0;
  const isAttemptInFlight = isReconnecting && !isWaitingToRetry;
  const retryCountdownSeconds = retryDelayMs !== null ? Math.max(1, Math.ceil(retryDelayMs / 1000)) : 0;

  let message = alertMessage ?? 'Server disconnected';
  if (hasConnectionIssue && isReconnecting) {
    message = connection.retryAttempt > 1
      ? `Reconnecting… (attempt ${connection.retryAttempt})`
      : 'Reconnecting…';
    if (isWaitingToRetry) {
      message = connection.retryAttempt > 1
        ? `Retrying in ${retryCountdownSeconds}s (attempt ${connection.retryAttempt})`
        : `Retrying in ${retryCountdownSeconds}s`;
    }
  } else if (hasConnectionIssue && connection.lastDisconnectReason) {
    message = connection.lastDisconnectReason;
  }

  return {
    mounted,
    bottomPad,
    heightAnim,
    isCompact,
    hasConnectionIssue,
    isReconnecting,
    isAttemptInFlight,
    isWaitingToRetry,
    message,
    onRetry: handleTap,
  };
}
