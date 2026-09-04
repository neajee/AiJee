import { Fonts } from '@/constants/theme';

export const styles = {
  container: { gap: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  groupLabel: { fontSize: 13, fontFamily: Fonts.sansSemiBold, fontWeight: '600' },
  expandedList: { paddingLeft: 2, gap: 4 },
  expandedItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 , paddingBottom: 2 },
  expandedItemText: { fontSize: 12, fontFamily: Fonts.sans, flex: 1 },
  showMoreBtn: { paddingTop: 4, paddingBottom: 4, paddingLeft: 4, paddingRight: 4, alignSelf: 'flex-start' },
  showMorePressed: { opacity: 0.6 },
  showMoreText: { fontSize: 12, fontFamily: Fonts.sans },
} as const;
