import { Fonts } from '@/constants/theme';
import { DOT_SIZE, DOT_TOP, LOG_MAX_HEIGHT, SPINE_COLUMN, SPINE_X } from './changes-history';

export const styles = {
  logSection: { borderTopWidth: 0.633 },
  logHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 10, paddingRight: 10, height: 26 },
  logHeaderText: { fontSize: 10.5, fontFamily: Fonts.sansSemiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  logBody: { maxHeight: LOG_MAX_HEIGHT },
  logBodyContent: { paddingBottom: 6 },
  cleanState: { alignItems: 'center', justifyContent: 'center', paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: Fonts.sans, textAlign: 'center' },
  binLabel: { fontSize: 10, fontFamily: Fonts.sansSemiBold, textTransform: 'uppercase', letterSpacing: 0.4, paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 2 },
  logEntry: { flexDirection: 'row', paddingRight: 10, paddingLeft: 6 },
  spine: { width: SPINE_COLUMN },
  spineLineTop: { position: 'absolute', left: SPINE_X, top: 0, height: DOT_TOP, width: 1 },
  spineLineBottom: { position: 'absolute', left: SPINE_X, top: DOT_TOP, bottom: 0, width: 1 },
  dot: { position: 'absolute', left: SPINE_X - (DOT_SIZE - 1) / 2, top: DOT_TOP - DOT_SIZE / 2, width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2 },
  entryBody: { flex: 1, paddingTop: 3 , paddingBottom: 3 },
  logMessage: { fontSize: 11.5, fontFamily: Fonts.sans, lineHeight: 15 },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  logHash: { fontSize: 10, fontFamily: Fonts.mono },
  logAuthor: { fontSize: 10, fontFamily: Fonts.sans, flexShrink: 1 },
  logDate: { fontSize: 10, fontFamily: Fonts.sans },
} as const;
