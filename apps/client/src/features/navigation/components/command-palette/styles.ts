import { ABSOLUTE_FILL_STYLE } from "@/constants/layout";
import { Fonts } from '@/constants/theme';

export const styles = {
  root: { flex: 1, alignItems: 'center', paddingTop: 80 },
  overlay: { ...ABSOLUTE_FILL_STYLE, backgroundColor: 'rgba(0,0,0,0.35)' },
  palette: {
    width: '90%',
    maxWidth: 560,
    borderRadius: 12,
    borderWidth: 0.633,
    overflow: 'hidden',
    maxHeight: 420,
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16, paddingRight: 16,
    height: 48,
    gap: 10,
    borderBottomWidth: 0.633,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Fonts.sans, outlineStyle: 'none' } as any,
  results: { maxHeight: 370 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, gap: 10 },
  itemText: { flex: 1 },
  itemLabel: { fontSize: 13, fontFamily: Fonts.sans },
  itemDesc: { fontSize: 11, fontFamily: Fonts.sans, marginTop: 1 },
  enterHint: { fontSize: 14, fontFamily: Fonts.mono },
  emptyState: { paddingTop: 24, paddingBottom: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: Fonts.sans },
} as const;
