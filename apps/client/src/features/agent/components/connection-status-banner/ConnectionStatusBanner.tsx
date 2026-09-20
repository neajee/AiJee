import { Animated } from "@/platform/animation";
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
  return <div className={"" + " " + "h-[0] pb-[0]"}>
      <div className={"" + " " + (isCompact ? "" : "")}>
        <span className={""}>
          {message}
        </span>
        <button role="button" accessibilityState={{
        busy: isAttemptInFlight,
        disabled: isAttemptInFlight
      }} disabled={isAttemptInFlight} onClick={onRetry}>
          <div className={""}>
            {isAttemptInFlight ? <span size="small" color="#A22E26" className={""} /> : null}
            <span className={""}>
              {hasConnectionIssue ? isWaitingToRetry ? 'Retry now' : isAttemptInFlight ? 'Retrying…' : 'Retry' : 'Dismiss'}
            </span>
          </div>
        </button>
      </div>
    </div>;
}
