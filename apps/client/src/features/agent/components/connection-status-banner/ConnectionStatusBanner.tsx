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
  if (!hasConnectionIssue && !isReconnecting) return null;
  return <div className="flex items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm">
      <div>
        <span className="inline-block">
          {message}
        </span>
        <button role="button" disabled={isAttemptInFlight} onClick={onRetry}>
          <div className="flex flex-col">
            {isAttemptInFlight ? <span className={"block" + " size-3 animate-spin"} /> : null}
            <span className="inline-block">
              {hasConnectionIssue ? isWaitingToRetry ? 'Retry now' : isAttemptInFlight ? 'Retrying…' : 'Retry' : 'Dismiss'}
            </span>
          </div>
        </button>
      </div>
    </div>;
}
