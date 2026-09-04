import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";
export const aboutStyles = StyleSheet.create({
  groupTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  // ── Hero ──
  hero: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: 16 },
  heroMain: { flex: 1, minWidth: 0, gap: 6 },
  heroVersion: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.mono },
  heroMeta: { fontSize: 12, fontFamily: Fonts.sans },
  heroAction: { flexShrink: 0 },
  heroBtn: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  heroBtnAccent: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 8 },
  heroBtnText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  heroBtnTextAccent: { fontSize: 12, fontFamily: Fonts.sansMedium },
  // ── Changelog timeline ──
  timelineBlock: { position: 'relative' },
  // One continuous rail from the first dot's top to the last dot's bottom
  // (rows are fixed at 44, so 18 == dot top offset in every row).
  timelineRail: { position: 'absolute', left: 15.5, top: 18, bottom: 18, width: StyleSheet.hairlineWidth },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineTag: { fontSize: 13, fontFamily: Fonts.mono, flexShrink: 0 },
  timelineTime: { fontSize: 12, fontFamily: Fonts.sans, flexShrink: 0 },
  releaseHead: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  releaseCount: { flex: 1, minWidth: 0, fontSize: 11, fontFamily: Fonts.sans, flexShrink: 1 },
  releaseBody: { paddingHorizontal: 28, paddingVertical: 12, gap: 12 },
  noteGroup: { gap: 6 },
  noteCat: { fontSize: 12, fontFamily: Fonts.sansSemiBold },
  noteRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  noteTitle: { flex: 1, fontSize: 13, fontFamily: Fonts.sans, lineHeight: 18 },
  noteCommit: { fontSize: 11, fontFamily: Fonts.mono, flexShrink: 0 },
  currentBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 2 },
  currentBadgeText: { fontSize: 11, fontFamily: Fonts.sansMedium },
  timelineEmpty: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
});
