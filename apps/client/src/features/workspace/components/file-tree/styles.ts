import { Fonts } from '@/constants/theme';

export const styles = {
  treeContainer: {
    flex: 1,
  },
  splitRow: {
    flex: 1,
    flexDirection: "row",
  },
  splitContent: {
    flex: 1,
  },
  readerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingLeft: 24, paddingRight: 24,
  },
  readerEmptyTitle: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  readerEmptyHint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: "center",
  },
  splitTree: {
    borderLeftWidth: 0.633,
  },
  content: {
    paddingBottom: 12,
  },
  filterRow: {
    paddingLeft: 6, paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 4,
  },
  filterField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingLeft: 8, paddingRight: 8,
    borderRadius: 6,
    borderWidth: 0.633,
  },
  filterInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    borderRadius: 0,
    outlineStyle: "none",
  } as any,
  filterClear: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingTop: 2, paddingBottom: 2,
    paddingRight: 6,
    minHeight: 22,
  },
  iconSlot: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    flex: 1,
  },
  dirName: {
    fontFamily: Fonts.sansMedium,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: "center",
    marginTop: 32,
  },
  emptyDir: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingTop: 4, paddingBottom: 4,
    fontStyle: "italic",
  },

  // File viewer
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 4,
    paddingRight: 10,
    height: 34,
    borderBottomWidth: 0.633,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  crumbTrail: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  crumbSeparator: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  crumbName: {
    flexShrink: 0,
    fontSize: 12.5,
    fontFamily: Fonts.sansMedium,
  },
  viewerMeta: {
    marginLeft: 6,
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  viewerMessageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 24, paddingRight: 24,
  },
} as const;
