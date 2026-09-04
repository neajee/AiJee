import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  dialog: { width: '100%', maxWidth: 420, borderRadius: 14, borderWidth: 0.633, padding: 20, gap: 12, maxHeight: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 17, fontFamily: Fonts.sansSemiBold },
  subtitle: { fontSize: 13, fontFamily: Fonts.sans },
  list: { maxHeight: 320 },
  listContent: { gap: 8 },
  option: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionName: { fontSize: 14, fontFamily: Fonts.sansMedium },
  optionDesc: { fontSize: 12, fontFamily: Fonts.sans },
  optionDetail: { fontSize: 11, fontFamily: Fonts.mono },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 0.633 },
  btnText: { fontSize: 13, fontFamily: Fonts.sansMedium },
});
