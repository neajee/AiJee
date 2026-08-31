import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const providerPageStyles = StyleSheet.create({
  page: { gap: 32, paddingBottom: 24 },
  pageHeading: { gap: 4 },
  pageTitle: { fontSize: 18, fontFamily: Fonts.sansSemiBold },
  pageSubtitle: { fontSize: 13, fontFamily: Fonts.sans },
  search: { height: 40, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontFamily: Fonts.sans, outlineStyle: 'none' } as any,
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rows: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, overflow: 'visible' },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  rowMain: { flex: 1, minWidth: 0, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: -4 },
  mark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowName: { fontSize: 13, fontFamily: Fonts.sansMedium },
  rowMeta: { fontSize: 12, fontFamily: Fonts.sans },
  iconAction: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  emptyRow: { minHeight: 56, justifyContent: 'center', paddingHorizontal: 12 },
  foldRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 6 },
  foldText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  addRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12 },
  inlinePanel: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  panelActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8 },
  secondaryButton: { minHeight: 36, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButton: { minHeight: 36, borderRadius: 8, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  textButton: { minHeight: 36, paddingHorizontal: 8, justifyContent: 'center', marginRight: 'auto' },
  linkText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  modelEditorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuAnchor: { position: 'relative' },
  moreButton: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontSize: 15, letterSpacing: 1 },
  menu: { position: 'absolute', right: 0, top: 40, zIndex: 20, minWidth: 112, minHeight: 40, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, boxShadow: '0 4px 14px rgba(0,0,0,.18)' } as any,
  menuText: { fontSize: 13, fontFamily: Fonts.sansMedium },
  saveBar: { position: 'sticky', bottom: 0, zIndex: 10, minHeight: 64, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 4 } as any,
  saveButton: { minHeight: 40, borderRadius: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 13, fontFamily: Fonts.sansSemiBold },
  feedback: { fontSize: 12, fontFamily: Fonts.sans, textAlign: 'right' },
  message: { fontSize: 13, fontFamily: Fonts.sans, paddingVertical: 16 },
});

export const sectionWebStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    paddingVertical: 9,
    minHeight: 36,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
});

export const cardWebStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelBtnText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelIconBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyModels: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    paddingVertical: 2,
  },
});

export const modelWebStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});

export const fieldWebStyles = StyleSheet.create({
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
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export const apiWebStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.sansMedium,
  },
});

export const addWebStyles = StyleSheet.create({
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
});

// ─── Styles: 移动端原生版 ────────────────────────────────────

export const sectionNativeStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 13,
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
    paddingVertical: 13,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
});

export const cardNativeStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  modelsList: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
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
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addModelIconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  emptyModels: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    paddingVertical: 2,
  },
});

export const modelNativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
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
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  smallBtnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
});

export const fieldNativeStyles = StyleSheet.create({
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
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export const apiNativeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 14,
    fontFamily: Fonts.sansMedium,
  },
});

export const addNativeStyles = StyleSheet.create({
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
    paddingHorizontal: 16,
    paddingVertical: 11,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  btnText: {
    fontSize: 15,
    fontFamily: Fonts.sansMedium,
  },
});
