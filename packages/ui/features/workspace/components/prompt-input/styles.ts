import { Platform, StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    maxWidth: 1080,
    alignSelf: "center",
    width: "100%",
    overflow: "visible",
  },
  sendError: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  sendErrorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  speechError: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  speechErrorText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  composerStack: {
    position: "relative",
    overflow: "visible",
    zIndex: Platform.OS === "android" ? 8 : 10,
  },
  attachmentNotice: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 15,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  card: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 0.633,
    position: "relative",
    zIndex: Platform.OS === "android" ? 5 : 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    fontSize: 15,
    fontFamily: Fonts.sans,
    outlineStyle: "none" as never,
  },
  actionRow: {
    flexDirection: "row",
    // Centred: the row now mixes 32px round buttons with the shorter model
    // control, and bottom alignment would leave the text sitting low.
    alignItems: "center",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  micWaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  queueActionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  queueActionButton: {
    height: 32,
    borderRadius: 999,
    borderWidth: 0.633,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  queueActionText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  queuePanel: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginBottom: 8,
    padding: 8,
    gap: 6,
  },
  queueHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  queueHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  queueStatus: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  queueActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  queueActionLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansMedium,
  },
  queuedMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  queuedMessageKind: {
    width: 52,
    fontSize: 10,
    fontFamily: Fonts.sansMedium,
  },
  queuedMessageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.sans,
  },
  bottomControlsWrap: {
    overflow: "visible",
    position: "relative",
    zIndex: Platform.OS === "android" ? 4 : 7,
  },
  bottomControlsWrapElevated: {
    zIndex: Platform.OS === "android" ? 12 : 12,
  },
  bottomControlsHidden: {
    opacity: 0,
    pointerEvents: "none" as const,
  },
  bottomControlsCollapsed: {
    height: 0,
    overflow: "hidden" as const,
    opacity: 0,
    pointerEvents: "none" as const,
  },
});
