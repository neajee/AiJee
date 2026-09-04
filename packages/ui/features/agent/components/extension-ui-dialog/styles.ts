import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";

export const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
    overflow: "visible",
  },
  container: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 0.633,
    borderBottomWidth: 0,
    overflow: "hidden",
    zIndex: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 0.633,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sansMedium,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sans,
  },
  timeout: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: Fonts.sans,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    maxHeight: 260,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    height: 40,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  actionArea: {
    padding: 12,
  },
  input: {
    minHeight: 44,
    borderWidth: 0.633,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  editor: {
    minHeight: 180,
    borderWidth: 0.633,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.mono,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderTopWidth: 0.633,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 36,
    borderWidth: 0.633,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  primaryButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  errorWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.sans,
  },
});
