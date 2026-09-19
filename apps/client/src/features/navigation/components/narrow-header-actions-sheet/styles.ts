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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 360,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingLeft: 20, paddingRight: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  list: {
    paddingLeft: 12, paddingRight: 12,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12, paddingRight: 12,
    borderBottomWidth: 1,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
} as const;
