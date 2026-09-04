import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.633, gap: 8 },
  title: { fontSize: 12, fontFamily: Fonts.sansSemiBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  targetList: { gap: 8, alignItems: 'center' },
  targetChip: { minHeight: 30, maxWidth: 180, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  targetChipLabel: { fontSize: 12, fontFamily: Fonts.sansMedium },
  content: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: Fonts.sansSemiBold },
  emptyBody: { fontSize: 13, lineHeight: 18, textAlign: 'center', fontFamily: Fonts.sans },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addPortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  portInput: { width: 140, height: 34, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, fontSize: 13, fontFamily: Fonts.sans },
  addPortBtn: { height: 34, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addPortBtnText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  suggestionsWrap: { marginTop: 16, alignItems: 'center', gap: 8 },
  suggestionsLabel: { fontSize: 11, fontFamily: Fonts.sansMedium, textTransform: 'uppercase', letterSpacing: 0.4 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  suggestionChip: { height: 30, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  suggestionChipText: { fontSize: 12, fontFamily: Fonts.sansMedium },
  inlinePortRow: { flexDirection: 'row', alignItems: 'center' },
  inlinePortInput: { width: 72, height: 30, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, fontSize: 12, fontFamily: Fonts.mono },
  addChipBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
});
