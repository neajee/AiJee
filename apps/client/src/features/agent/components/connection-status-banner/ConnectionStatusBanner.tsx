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
      <div className={" "}>
        <span className={"block"}>
          {message}
        </span>
        <button role="button" accessibilityState={{
        busy: isAttemptInFlight,
        disabled: isAttemptInFlight
      }} disabled={isAttemptInFlight} onClick={onRetry}>
          <div className={"block"}>
            {isAttemptInFlight ? <span size="small" color="#A22E26" className={"block"} /> : null}
            <span className={"block"}>
              {hasConnectionIssue ? isWaitingToRetry ? 'Retry now' : isAttemptInFlight ? 'Retrying…' : 'Retry' : 'Dismiss'}
            </span>
          </div>
        </button>
      </div>
    </div>;
}
