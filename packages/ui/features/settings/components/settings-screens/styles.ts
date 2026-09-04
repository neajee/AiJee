import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1, width: '100%' },
  title: { fontFamily: Fonts.sansBold },
  navBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  navBarInner: { flexDirection: 'row', alignItems: 'center', width: '100%', alignSelf: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: Fonts.sansSemiBold, flex: 1 },
});

export const desktopStyles = StyleSheet.create({
  detail: { flex: 1, minWidth: 0 },
  detailHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  detailHeaderCopy: { gap: 2 },
  detailTitle: { fontSize: 15, fontFamily: Fonts.sansSemiBold },
  detailScroll: { flex: 1 },
});
