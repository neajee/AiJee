import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  tabPanels: { flex: 1, position: 'relative' },
  tabPanel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  tabPanelHidden: { opacity: 0, zIndex: 0 },
  gitChanges: { flex: 1 },
  changesSection: { flex: 1, borderBottomWidth: 0.633 },
  sectionHeader: { height: 26, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionHeaderText: { fontSize: 10.5, fontFamily: Fonts.sansSemiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { fontSize: 10.5, fontFamily: Fonts.mono },
  contentInner: { paddingBottom: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 32 },
});
