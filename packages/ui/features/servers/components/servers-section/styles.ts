import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";

export const styles = StyleSheet.create({
  content: { width: '100%' },
  // Heading lines up with the card edge, the same way ModelSection titles do.
  sectionHeading: { gap: 6 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  sectionCaption: { fontSize: 12, fontFamily: Fonts.sans, opacity: 0.5, marginTop: 4 },
  serverCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'hidden' },
  serverRowWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  activeRail: { width: 2, alignSelf: 'stretch' },
  serverRow: { flex: 1, minWidth: 0, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  statusLine: { minWidth: 0 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: -4 },
  // Aligned with the model list's divider (12 padding + 30 tile + 12 gap).
  rowDivider: { position: 'absolute', left: 54, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  qrAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  moreAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginLeft: 12, marginRight: 12, opacity: 0, transitionProperty: 'opacity, background-color', transitionDuration: '120ms' } as any,
  menuBackdrop: { flex: 1 },
  menuSheet: { width: 220, borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingVertical: 4, position: 'absolute', boxShadow: '0 6px 18px rgba(0,0,0,.16)' } as any,
  menuAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  menuActionText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  menuDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  footerAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
  footerActionText: { fontSize: 13, fontFamily: Fonts.sansMedium, opacity: 0.7 },
  footerDivider: { position: 'absolute', top: 0, left: 12, right: 0, height: StyleSheet.hairlineWidth },
  welcome: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  welcomeContent: {
    alignItems: "center",
    maxWidth: 360,
  },
  welcomeIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    lineHeight: 30,
    fontFamily: Fonts.sansMedium,
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Fonts.sans,
    textAlign: "center",
    marginBottom: 24,
  },
  welcomeButtons: {
    flexDirection: "row",
    gap: 10,
  },
  welcomeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  welcomeButtonText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
  codeBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    padding: 24,
  },
  codeDialog: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    borderRadius: 14,
    padding: 24,
    gap: 10,
  },
  codeTitle: {
    fontSize: 17,
    fontFamily: Fonts.sansMedium,
  },
  codeHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeImage: {
    width: 240,
    height: 240,
    marginVertical: 6,
  },
  codeLabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  codeValue: {
    fontSize: 18,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copyUrlButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  closeCodeButton: {
    paddingVertical: 4,
  },
});
