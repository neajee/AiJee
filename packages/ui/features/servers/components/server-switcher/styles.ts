import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 30, paddingHorizontal: 6, borderRadius: 8 },
  serverIcon: { width: 20, height: 20, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  serverName: { flex: 1, fontSize: 13, fontFamily: Fonts.sansMedium },
  popover: { position: 'absolute', top: 34, left: 0, width: 236, maxWidth: 280, borderRadius: 10, borderWidth: 0.633, zIndex: 1000, boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.15)', elevation: 12, overflow: 'hidden' } as any,
  popoverHeader: { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8, minHeight: 34 },
  popoverTitle: { fontSize: 11, fontFamily: Fonts.sansSemiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  popoverList: { maxHeight: 240 },
  popoverItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 54 },
  popoverItemIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  popoverItemInfo: { flex: 1 },
  popoverItemName: { fontSize: 13, fontFamily: Fonts.sansMedium },
  popoverItemAddress: { fontSize: 11, fontFamily: Fonts.sans, marginTop: 1 },
  popoverFooter: { borderTopWidth: 0.633, paddingVertical: 4 },
  popoverFooterBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  popoverFooterText: { fontSize: 13, fontFamily: Fonts.sansMedium },
});
