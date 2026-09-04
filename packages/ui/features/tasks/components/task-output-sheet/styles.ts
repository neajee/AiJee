import { ABSOLUTE_FILL_STYLE } from "@/constants/layout";
import { Fonts } from '@/constants/theme';

export const styles = {
  root: {
    ...ABSOLUTE_FILL_STYLE,
    zIndex: 100,
  },
  overlay: {
    ...ABSOLUTE_FILL_STYLE,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16, paddingRight: 16,
    paddingBottom: 8,
    borderBottomWidth: 0.633,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerLabel: {
    fontSize: 15,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
  },
  headerCmd: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    flex: 1,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
    padding: 12,
  },
  logLine: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    lineHeight: 18,
  },
} as const;
