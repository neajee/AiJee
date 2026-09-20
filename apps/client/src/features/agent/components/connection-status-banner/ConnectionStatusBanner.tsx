import { Animated } from "@/styles/motion";
import type { ConnectionStatusBannerViewProps } from './component-types';
export function ConnectionStatusBannerView({
  bottomPad,
  heightAnim,
  isCompact,
  hasConnectionIssue,
  isReconnecting,
  isAttemptInFlight,
  isWaitingToRetry,
  message,
  onRetry
}: ConnectionStatusBannerViewProps) {
  return <div className={"  h-0 pb-0"}>
      <div>
        <span className={"block"}>
          {message}
        </span>
        <button role="button" disabled={isAttemptInFlight} onClick={onRetry}>
          <div className={"block"}>
            {isAttemptInFlight ? <span className={"block" + " size-3 animate-spin"} /> : null}
            <span className={"block"}>
              {hasConnectionIssue ? isWaitingToRetry ? 'Retry now' : isAttemptInFlight ? 'Retrying…' : 'Retry' : 'Dismiss'}
            </span>
          </div>
        </button>
      </div>
    </div>;
}
