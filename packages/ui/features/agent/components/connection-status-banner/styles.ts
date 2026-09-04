import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  strip: {
    backgroundColor: '#C73D32',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  contentCompact: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingVertical: 10,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  retryButton: {
    minHeight: 32,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  retryButtonBusy: {
    minWidth: 112,
  },
  retryButtonDisabled: {
    opacity: 0.8,
  },
  retryButtonPressed: {
    opacity: 0.85,
  },
  retryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retrySpinner: {
    transform: [{ scale: 0.85 }],
  },
  retryButtonText: {
    color: '#A22E26',
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
