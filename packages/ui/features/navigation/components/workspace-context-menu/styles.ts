import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  menu: { position: 'absolute', zIndex: 1000, width: 170, borderRadius: 8, borderWidth: 0.633, paddingVertical: 4, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)', elevation: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  menuText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  separator: { height: 0.633, marginHorizontal: 8 },
});
