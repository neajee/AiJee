import { Fonts } from '@/constants/theme';

export const styles = {
  screen: { flex: 1 },
  scroll: { flex: 1, width: '100%' },
  title: { fontFamily: Fonts.sansBold },
  navBar: { borderBottomWidth: 0.5 },
  navBarInner: { flexDirection: 'row', alignItems: 'center', width: '100%', alignSelf: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: Fonts.sansSemiBold, flex: 1 },
} as const;

export const desktopStyles = {
  detail: { flex: 1, minWidth: 0 },
  detailHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5 },
  detailHeaderCopy: { gap: 2 },
  detailTitle: { fontSize: 15, fontFamily: Fonts.sansSemiBold },
  detailScroll: { flex: 1 },
} as const;
