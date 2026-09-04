import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  fileName: { fontSize: 12, fontFamily: Fonts.sansMedium, fontWeight: '500', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  metaAdd: { fontSize: 10, fontFamily: Fonts.mono },
  metaRemove: { fontSize: 10, fontFamily: Fonts.mono },
  fullscreenButton: { position: 'absolute', top: 10, right: 10, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 0.5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  fullscreenButtonText: { fontSize: 11, fontFamily: Fonts.sansMedium },
  diffWrap: { borderRadius: 6, overflow: 'hidden' },
  heroRoot: { flex: 1 },
  heroBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroBackdropPressable: { ...StyleSheet.absoluteFillObject },
  heroCard: { position: 'absolute', borderWidth: 0.5, overflow: 'hidden' },
  fullscreenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 0.5 },
  modalTitle: { flex: 1, fontSize: 14, fontFamily: Fonts.sansSemiBold, marginRight: 12 },
  modalCloseButton: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fullscreenBody: { flex: 1, padding: 12 },
});
