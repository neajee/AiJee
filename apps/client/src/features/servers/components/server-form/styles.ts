import { Fonts } from '@/constants/theme';

export const SHEET_HEIGHT = 520;

export const sheetStyles = {
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  keyboardAvoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: SHEET_HEIGHT,
  },
  handleBar: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  sheetHeader: { paddingLeft: 20, paddingRight: 20, paddingBottom: 12 },
  sheetTitle: { fontSize: 15, fontFamily: Fonts.sansSemiBold, textAlign: 'left' },
  sheetContent: { paddingLeft: 20, paddingRight: 20, gap: 20, paddingBottom: 8 },
  sheetSaveBtn: { alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 8 },
  sheetSaveBtnText: { fontSize: 15, fontFamily: Fonts.sansSemiBold, textAlign: 'left' },
} as const;

export const formStyles = {
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    borderWidth: 0.633,
    padding: 24,
    gap: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontFamily: Fonts.sansSemiBold, textAlign: 'left' },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: { gap: 14 },
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 40,
    borderRadius: 6,
    borderWidth: 0.633,
    paddingLeft: 12, paddingRight: 12,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingLeft: 18, paddingRight: 18, paddingTop: 9, paddingBottom: 9, borderRadius: 6, borderWidth: 0.633 },
  btnPrimary: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  btnText: { fontSize: 13, fontFamily: Fonts.sansSemiBold, textAlign: 'left' },
  errorText: { fontSize: 13, fontFamily: Fonts.sans, textAlign: 'left' },
} as const;
