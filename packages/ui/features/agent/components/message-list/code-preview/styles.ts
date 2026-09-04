import { Fonts } from "@/constants/theme";

export const styles = {
  container: {
    borderRadius: 6,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  bareContainer: {
    overflow: "hidden",
  },
  fillContainer: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    minHeight: 20,
  },
  lineNoCol: {
    width: 40,
    alignItems: "flex-end",
    paddingRight: 8,
    paddingTop: 1, paddingBottom: 1,
    borderRightWidth: 0.5,
  },
  lineNo: {
    fontSize: 11,
    lineHeight: 20,
    fontFamily: Fonts.mono,
  },
  lineText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.mono,
    paddingLeft: 8, paddingRight: 8,
    paddingTop: 1, paddingBottom: 1,
  },
  lineTextNoGutter: {
    paddingLeft: 10,
  },
  lineTextBare: {
    paddingLeft: 12, paddingRight: 12,
  },
} as const;
