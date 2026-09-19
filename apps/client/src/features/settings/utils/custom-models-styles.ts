import { HAIRLINE_WIDTH } from "@/constants/layout";
import { Fonts } from '@/constants/theme';

export const providerPageStyles = {
  page: { gap: 32, paddingBottom: 24 },
  pageHeading: { gap: 4 },
  pageTitle: { fontSize: 18, fontFamily: Fonts.sansSemiBold },
  pageSubtitle: { fontSize: 13, fontFamily: Fonts.sans },
  search: { height: 40, borderWidth: HAIRLINE_WIDTH, borderRadius: 8, paddingLeft: 12, paddingRight: 12, fontSize: 13, fontFamily: Fonts.sans, outlineStyle: 'none' } as any,
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rows: { borderWidth: HAIRLINE_WIDTH, borderRadius: 8, overflow: 'visible' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 12, gap: 12 },
  rowMain: { flex: 1, minWidth: 0, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: -4 },
  mark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rowMeta: { fontSize: 12, fontFamily: Fonts.sans },
  iconAction: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  divider: { height: HAIRLINE_WIDTH, marginLeft: 54 },
  emptyRow: { minHeight: 56, justifyContent: 'center', paddingLeft: 12 , paddingRight: 12 },
  foldRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 12, gap: 6 },
  foldText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  addRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, paddingRight: 12, gap: 12 },
  inlinePanel: { borderTopWidth: HAIRLINE_WIDTH, padding: 16, gap: 14, backgroundColor: 'rgba(127,127,127,0.045)' },
  modalPanel: { width: '100%', maxWidth: 520, borderWidth: HAIRLINE_WIDTH, borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 36px rgba(0,0,0,.28)' } as any,
  modalHeader: { minHeight: 58, paddingLeft: 16, paddingRight: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: HAIRLINE_WIDTH },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalTitleCopy: { gap: 2 },
  modalTitle: { fontSize: 15, fontFamily: Fonts.sansSemiBold },
  modalClose: { width: 32, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 16, gap: 14 },
  authMode: { alignSelf: 'flex-start', flexDirection: 'row', borderWidth: HAIRLINE_WIDTH, borderRadius: 7, padding: 2, gap: 2 },
  authModeItem: { minHeight: 30, paddingLeft: 10, paddingRight: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  panelActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  secondaryButton: { minHeight: 36, borderWidth: HAIRLINE_WIDTH, borderRadius: 8, paddingLeft: 12, paddingRight: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButton: { minHeight: 36, borderRadius: 8, paddingLeft: 14, paddingRight: 14, alignItems: 'center', justifyContent: 'center' },
  textButton: { minHeight: 36, paddingLeft: 8, paddingRight: 8, justifyContent: 'center', marginRight: 'auto' },
  linkText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  modelEditorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addModelButton: { minHeight: 32, borderWidth: HAIRLINE_WIDTH, borderRadius: 7, paddingLeft: 10, paddingRight: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  menuAnchor: { position: 'relative' },
  moreButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 15, letterSpacing: 1 },
  menu: { position: 'absolute', right: 0, top: 40, zIndex: 20, minWidth: 112, minHeight: 40, justifyContent: 'center', paddingLeft: 12, paddingRight: 12, borderRadius: 8, borderWidth: HAIRLINE_WIDTH, boxShadow: '0 4px 14px rgba(0,0,0,.18)' } as any,
  menuText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  saveBar: { position: 'sticky', bottom: 0, zIndex: 10, minHeight: 64, borderTopWidth: HAIRLINE_WIDTH, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingLeft: 4 , paddingRight: 4 } as any,
  saveButton: { minHeight: 40, borderRadius: 8, paddingLeft: 18, paddingRight: 18, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  feedback: { fontSize: 12, fontFamily: Fonts.sans, textAlign: 'right' },
  message: { fontSize: 13, fontFamily: Fonts.sans, paddingTop: 16 , paddingBottom: 16 },
} as const;

export const sectionWebStyles = {
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4, paddingRight: 4,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  list: {
    gap: 8,
  },
  loadingRow: {
    paddingLeft: 14, paddingRight: 14,
    paddingTop: 12, paddingBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 9, paddingBottom: 9,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: HAIRLINE_WIDTH,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  savingText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
} as const;

export const cardWebStyles = {
  card: {
    borderRadius: 8,
    borderWidth: HAIRLINE_WIDTH,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 8, paddingBottom: 8,
    minHeight: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  providerIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 13.5,
    fontFamily: Fonts.sansMedium,
  },
  providerMeta: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 6,
  },
  body: {
    padding: 12,
    gap: 12,
  },
  modelsSection: {
    gap: 8,
  },
  modelsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelsSectionTitle: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  addModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 6, paddingBottom: 6,
    borderRadius: 8,
    borderWidth: HAIRLINE_WIDTH,
  },
  addModelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 8,
    borderWidth: HAIRLINE_WIDTH,
    overflow: 'hidden',
  },
  addModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addModelInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.mono,
    height: 32,
    paddingLeft: 10, paddingRight: 10,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
  addModelIconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyModels: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingTop: 2, paddingBottom: 2,
  },
} as const;

export const modelWebStyles = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 8, paddingBottom: 8,
    minHeight: 34,
    gap: 8,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  modelId: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  modelMeta: {
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  editWrap: {
    margin: 8,
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  editGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  smallBtn: {
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 7, paddingBottom: 7,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
  smallBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
} as const;

export const fieldWebStyles = {
  container: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  input: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    height: 32,
    paddingLeft: 10, paddingRight: 10,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
} as const;

export const apiWebStyles = {
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 6, paddingBottom: 6,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
} as const;

export const addWebStyles = {
  formTitle: {
    fontSize: 13.5,
    fontFamily: Fonts.sansMedium,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  btn: {
    paddingLeft: 14, paddingRight: 14,
    paddingTop: 8, paddingBottom: 8,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
  btnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
} as const;

// ─── Styles: 移动端原生版 ────────────────────────────────────

export const sectionNativeStyles = {
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16, paddingRight: 16,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  list: {
    gap: 8,
  },
  loadingRow: {
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 13, paddingBottom: 13,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 13, paddingBottom: 13,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: HAIRLINE_WIDTH,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
  savingText: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: 2,
  },
} as const;

export const cardNativeStyles = {
  card: {
    borderRadius: 12,
    borderWidth: HAIRLINE_WIDTH,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 12, paddingBottom: 12,
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  providerIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  providerName: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
  },
  providerMeta: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
  },
  body: {
    padding: 16,
    gap: 14,
  },
  modelsSection: {
    gap: 8,
    marginTop: 2,
  },
  modelsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelsSectionTitle: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  addModelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 8, paddingBottom: 8,
    minHeight: 36,
    borderRadius: 9,
    borderWidth: HAIRLINE_WIDTH,
  },
  addModelBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
    overflow: 'hidden',
  },
  addModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addModelInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.mono,
    height: 44,
    paddingLeft: 12, paddingRight: 12,
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  addModelIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  emptyModels: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingTop: 2, paddingBottom: 2,
  },
} as const;

export const modelNativeStyles = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 11, paddingBottom: 11,
    minHeight: 48,
    gap: 10,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  modelId: {
    fontSize: 15,
    fontFamily: Fonts.mono,
  },
  modelMeta: {
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  editWrap: {
    margin: 10,
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  editGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  smallBtn: {
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 11, paddingBottom: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  smallBtnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
} as const;

export const fieldNativeStyles = {
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  input: {
    // ≥16px avoids iOS Safari's focus zoom.
    fontSize: 16,
    fontFamily: Fonts.sans,
    height: 44,
    paddingLeft: 12, paddingRight: 12,
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
} as const;

export const apiNativeStyles = {
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingLeft: 14, paddingRight: 14,
    paddingTop: 10, paddingBottom: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
} as const;

export const addNativeStyles = {
  formTitle: {
    fontSize: 16,
    fontFamily: Fonts.sansMedium,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    paddingLeft: 16, paddingRight: 16,
    paddingTop: 11, paddingBottom: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  btnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
} as const;
