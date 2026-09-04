import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 440, borderRadius: 14, padding: 20, boxShadow: '0px 8px 24px rgba(0,0,0,0.2)', elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 17, fontFamily: Fonts.sansSemiBold },
  closeButton: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: Fonts.sansMedium, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 8, borderWidth: 0.633, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 14, fontFamily: Fonts.sans, outlineStyle: 'none' } as any,
  pathText: { fontSize: 13, fontFamily: Fonts.sans, opacity: 0.7 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  cancelButton: { height: 36, paddingHorizontal: 16, borderRadius: 8, borderWidth: 0.633, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: Fonts.sansMedium },
  saveButton: { height: 36, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 14, fontFamily: Fonts.sansMedium },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheetContainer: { borderTopLeftRadius: 14, borderTopRightRadius: 14, overflow: 'visible' },
  sheetHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  sheetHandleBar: { width: 36, height: 4, borderRadius: 2 },
  sheetTitle: { fontSize: 17, fontFamily: Fonts.sansSemiBold, paddingHorizontal: 20, paddingBottom: 16 },
  sheetBody: { maxHeight: 300 },
  sheetBodyContent: { paddingHorizontal: 20, paddingBottom: 4 },
});
