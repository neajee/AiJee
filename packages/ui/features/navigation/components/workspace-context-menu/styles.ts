import { Fonts } from '@/constants/theme';

export const styles = {
  menu: { position: 'absolute', zIndex: 1000, width: 170, borderRadius: 8, borderWidth: 0.633, paddingTop: 4, paddingBottom: 4, boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)', elevation: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 12, paddingRight: 12, paddingTop: 8 , paddingBottom: 8 },
  menuText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  separator: { height: 0.633, marginLeft: 8 , marginRight: 8 },
} as const;
