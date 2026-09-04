import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";

export const styles = StyleSheet.create({
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
    paddingVertical: 1,
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
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  lineTextNoGutter: {
    paddingLeft: 10,
  },
  lineTextBare: {
    // paddingLeft must be set explicitly: an edge-specific padding from an
    // earlier style in the array would otherwise win over paddingHorizontal.
    paddingHorizontal: 12,
    paddingLeft: 12,
  },
});
