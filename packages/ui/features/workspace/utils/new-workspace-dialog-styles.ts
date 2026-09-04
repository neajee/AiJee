import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";

export const styles = StyleSheet.create({
  // Desktop dialog
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.24)',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerCopy: { gap: 3 },
  title: {
    fontSize: 16,
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: { fontSize: 12, fontFamily: Fonts.sans },

  // Shared form
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 38,
    borderRadius: 7,
    borderWidth: 0.633,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.sans,
    outlineStyle: 'none',
  } as any,
  pathPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  pathPreviewLabel: { fontSize: 11, fontFamily: Fonts.sansMedium },
  pathPreviewValue: { flex: 1, fontSize: 11, fontFamily: Fonts.mono },
  nameInput: {
    paddingLeft: 0,
  },
  hint: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 4,
    paddingLeft: 2,
  },


  // Suggestions popover
  suggestionsPopover: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 0.633,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    elevation: 8,
    zIndex: 20,
  },
  inlineSuggestionsPopover: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 0.633,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    elevation: 8,
  },
  suggestionsScroll: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 0.633,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  createButton: {
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },

  // Mobile bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'visible',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: Fonts.sansSemiBold,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sheetBody: {
    maxHeight: 360,
  },
  sheetBodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});
