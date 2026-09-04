import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";

export const SUMMARY_BLOCKS = 5;
export const SUMMARY_SCROLL_AFTER = 8;
export const SUMMARY_ROW_HEIGHT = 22;

export const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { flex: 1 },
  content: {
    paddingTop: 8,
    paddingBottom: 24,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
  },
  itemWrap: { paddingVertical: 2 },
  turnToolbar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  actionButton: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  actionError: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    zIndex: 30,
  },
  actionErrorText: { fontSize: 12, lineHeight: 18, fontFamily: Fonts.sans },
  summaryWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryHeader: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  summaryTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  summarySpacer: {
    flex: 1,
  },
  summaryList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: SUMMARY_ROW_HEIGHT * SUMMARY_SCROLL_AFTER + 12,
  },
  summaryListContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: SUMMARY_ROW_HEIGHT,
  },
  fileKind: {
    width: 9,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  filePath: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
  },
  fileCounts: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
    // Keeps the numbers in a column instead of ragged against the path.
    minWidth: 68,
  },
  fileCount: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  summaryLineCount: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.mono,
    fontWeight: "600",
  },
  summaryBlocks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 16,
  },
  summaryBlock: {
    width: 5,
    height: 10,
    borderRadius: 1,
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dividerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    flexShrink: 1,
  },
  dividerTime: {
    fontSize: 11,
    fontFamily: Fonts.mono,
    opacity: 0.7,
  },
  dividerChevron: {
    width: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  workLog: {
    marginLeft: 16,
    paddingLeft: 12,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 10,
    borderLeftWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  activityGroup: {
    minWidth: 0,
  },
  activityLabel: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  activityBody: {
    gap: 10,
    paddingLeft: 10,
  },
  stepText: {
    opacity: 0.75,
  },
  stepError: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  turnNotice: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  historyLoaderWrap: {
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLoader: {
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    fontWeight: "500",
  },
  scrollBtnWrap: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
  },
  scrollBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
