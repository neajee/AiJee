import { HAIRLINE_WIDTH } from "@/constants/layout";
import { Fonts } from "@/constants/theme";
export const aboutStyles = {
  groupTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  // ── Hero ──
  hero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: 16 },
  heroMain: { flex: 1, minWidth: 0, gap: 6 },
  heroVersion: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.mono },
  heroMeta: { fontSize: 12, fontFamily: Fonts.sans },
  heroAction: { flexShrink: 0 },
  heroBtn: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingLeft: 12, paddingRight: 12, borderRadius: 8, borderWidth: HAIRLINE_WIDTH },
  heroBtnAccent: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingLeft: 12, paddingRight: 12, borderRadius: 8 },
  heroBtnText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  heroBtnTextAccent: { fontSize: 12, fontFamily: Fonts.sansMedium },
  // ── Changelog timeline ──
  timelineBlock: { position: 'relative' },
  // One continuous rail from the first dot's top to the last dot's bottom
  // (rows are fixed at 44, so 18 == dot top offset in every row).
  timelineRail: { position: 'absolute', left: 15.5, top: 18, bottom: 18, width: HAIRLINE_WIDTH },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineTag: { fontSize: 13, fontFamily: Fonts.mono, flexShrink: 0 },
  timelineTime: { fontSize: 12, fontFamily: Fonts.sans, flexShrink: 0 },
  releaseHead: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 , paddingRight: 12 },
  releaseCount: { flex: 1, minWidth: 0, fontSize: 11, fontFamily: Fonts.sans, flexShrink: 1 },
  releaseBody: { paddingLeft: 28, paddingRight: 28, paddingTop: 12, paddingBottom: 12, gap: 12 },
  noteGroup: { gap: 6 },
  noteCat: { fontSize: 12, fontFamily: Fonts.sansSemiBold },
  noteRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  noteTitle: { flex: 1, fontSize: 13, fontFamily: Fonts.sans, lineHeight: 18 },
  noteCommit: { fontSize: 11, fontFamily: Fonts.mono, flexShrink: 0 },
  currentBadge: { borderRadius: 6, paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2, marginLeft: 2 },
  currentBadgeText: { fontSize: 11, fontFamily: Fonts.sansMedium },
  timelineEmpty: { minHeight: 44, justifyContent: 'center', paddingLeft: 12 , paddingRight: 12 },
} as const;
