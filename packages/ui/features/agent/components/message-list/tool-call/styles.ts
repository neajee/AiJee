import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  groupLabel: { fontSize: 13, fontFamily: Fonts.sansSemiBold, fontWeight: '600' },
  expandedList: { paddingLeft: 2, gap: 4 },
  expandedItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  expandedItemText: { fontSize: 12, fontFamily: Fonts.sans, flex: 1 },
  showMoreBtn: { paddingVertical: 4, paddingHorizontal: 4, alignSelf: 'flex-start' },
  showMorePressed: { opacity: 0.6 },
  showMoreText: { fontSize: 12, fontFamily: Fonts.sans },
});
