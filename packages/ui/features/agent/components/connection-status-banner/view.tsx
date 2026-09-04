import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { styles } from './styles';
import type { ConnectionStatusBannerViewProps } from './types';

export function ConnectionStatusBannerView({
  bottomPad,
  heightAnim,
  isCompact,
  hasConnectionIssue,
  isReconnecting,
  isAttemptInFlight,
  isWaitingToRetry,
  message,
  onRetry,
}: ConnectionStatusBannerViewProps) {
  return (
    <Animated.View style={[styles.strip, { height: heightAnim, paddingBottom: bottomPad }]}>
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <Text style={styles.text} numberOfLines={isCompact ? 2 : 1}>
          {message}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: isAttemptInFlight, disabled: isAttemptInFlight }}
          disabled={isAttemptInFlight}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            isReconnecting && styles.retryButtonBusy,
            isAttemptInFlight && styles.retryButtonDisabled,
            pressed && styles.retryButtonPressed,
          ]}
        >
          <View style={styles.retryButtonContent}>
            {isAttemptInFlight ? (
              <ActivityIndicator size="small" color="#A22E26" style={styles.retrySpinner} />
            ) : null}
            <Text style={styles.retryButtonText}>
              {hasConnectionIssue
                ? isWaitingToRetry
                  ? 'Retry now'
                  : isAttemptInFlight
                    ? 'Retrying…'
                    : 'Retry'
                : 'Dismiss'}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}
