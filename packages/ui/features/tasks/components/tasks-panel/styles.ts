import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  taskRowInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskRowLabel: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
  },
  taskRowCmd: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    marginTop: 1,
  },
  taskRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  sourceBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.sansSemiBold,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  groupBadge: {
    borderWidth: 0.633,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  groupBadgeText: {
    fontSize: 9,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 18,
  },
});
