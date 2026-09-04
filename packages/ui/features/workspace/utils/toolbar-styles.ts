import { Platform, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const TOOLBAR_WRAP_OFFSET = 10;
export const TOOLBAR_HORIZONTAL_MARGIN = 6;
export const TOOLBAR_BORDER_WIDTH = 0.633;
export const TOOLBAR_CORNER_RADIUS = 12;
export const TOOLBAR_VERTICAL_PADDING = Platform.OS === 'web' ? 7 : 9;
export const TOOLBAR_CONTROL_HEIGHT = Platform.OS === 'web' ? 26 : 30;
export const TOOLBAR_ANDROID_MARGIN_TOP = Platform.OS === 'android' ? -4 : 0;

export const TOOLBAR_MODE_TOGGLE_HEIGHT = TOOLBAR_CONTROL_HEIGHT + 2 + 2 * TOOLBAR_BORDER_WIDTH;

export const styles = StyleSheet.create({
  wrap: {
    marginTop: -TOOLBAR_WRAP_OFFSET,
    paddingTop: TOOLBAR_WRAP_OFFSET,
    marginHorizontal: TOOLBAR_HORIZONTAL_MARGIN,
    overflow: 'visible',
  },
  /** Inline: no strip of its own, it is one item in the action row. */
  inlineWrap: {
    flexShrink: 1,
    minWidth: 0,
    marginLeft: 2,
    overflow: 'visible',
  },
  inlineToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: TOOLBAR_VERTICAL_PADDING,
    borderWidth: TOOLBAR_BORDER_WIDTH,
    borderTopWidth: 0,
    borderBottomLeftRadius: TOOLBAR_CORNER_RADIUS,
    borderBottomRightRadius: TOOLBAR_CORNER_RADIUS,
    gap: 2,
    marginTop: TOOLBAR_ANDROID_MARGIN_TOP,
    zIndex: Platform.OS === 'android' ? 1 : 5,
  },
  toolbarError: {
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: TOOLBAR_CONTROL_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  spacer: {
    flex: 1,
  },
  taskSelector: {
    marginRight: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: TOOLBAR_CONTROL_HEIGHT,
    paddingHorizontal: 8,
    borderRadius: 6,
    maxWidth: 280,
  },
  buttonText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    flexShrink: 1,
  },
  effortButton: {
    gap: 3,
    paddingHorizontal: 6,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: TOOLBAR_BORDER_WIDTH,
    borderRadius: 999,
    padding: 1,
    marginRight: 8,
  },
  modeButton: {
    height: TOOLBAR_CONTROL_HEIGHT,
    borderRadius: 999,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modeButtonText: {
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
    letterSpacing: 0.2,
  },
  modePendingIndicator: {
    position: 'absolute',
    alignSelf: 'center',
  },
  popoverAnchor: {
    position: 'relative',
  },
  popover: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: TOOLBAR_BORDER_WIDTH,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
    zIndex: 10,
  },
  effortPopover: {
    minWidth: 118,
  },
  popoverScroll: {
    maxHeight: 320,
  },
  searchWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: TOOLBAR_BORDER_WIDTH,
  },
  searchInput: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    height: 28,
    paddingHorizontal: 6,
    outlineStyle: 'none',
  } as any,
  noResults: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  providerHeader: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    height: 34,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  modelName: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  effortItem: {
    minHeight: 32,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  effortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  effortLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});
