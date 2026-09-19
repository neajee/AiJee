import type { Animated } from "@/platform/dom";

export interface ConnectionStatusBannerViewProps {
  bottomPad: number;
  heightAnim: Animated.Value;
  isCompact: boolean;
  hasConnectionIssue: boolean;
  isReconnecting: boolean;
  isAttemptInFlight: boolean;
  isWaitingToRetry: boolean;
  message: string;
  onRetry: () => void;
}
