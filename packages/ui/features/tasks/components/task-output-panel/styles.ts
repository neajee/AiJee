import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0.633,
    flexShrink: 0,
  },
  minimizedContainer: {
    borderTopWidth: 0.633,
    flexShrink: 0,
  },
  minimizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dragHandle: {
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'row-resize' as any,
  },
  dragBar: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 0.633,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerLabel: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: '500',
  },
  headerCmd: {
    fontSize: 10,
    fontFamily: Fonts.mono,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
    padding: 8,
  },
  logLine: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    lineHeight: 16,
  },
});
