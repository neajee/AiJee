import { toTailwind } from "@/styles/to-tailwind";
import { Animated } from "@/platform/animation";
import { styles } from './style-tokens';
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
  return <div className={toTailwind([styles.strip, {
    height: heightAnim,
    paddingBottom: bottomPad
  }])}>
      <div className={toTailwind([styles.content, isCompact && styles.contentCompact])}>
        <span className={toTailwind(styles.text)}>
          {message}
        </span>
        <button role="button" accessibilityState={{
        busy: isAttemptInFlight,
        disabled: isAttemptInFlight
      }} disabled={isAttemptInFlight} onClick={onRetry}>
          <div className={toTailwind(styles.retryButtonContent)}>
            {isAttemptInFlight ? <span size="small" color="#A22E26" className={toTailwind(styles.retrySpinner)} /> : null}
            <span className={toTailwind(styles.retryButtonText)}>
              {hasConnectionIssue ? isWaitingToRetry ? 'Retry now' : isAttemptInFlight ? 'Retrying…' : 'Retry' : 'Dismiss'}
            </span>
          </div>
        </button>
      </div>
    </div>;
}
