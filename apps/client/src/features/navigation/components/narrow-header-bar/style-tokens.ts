import { Fonts } from '@/constants/theme';

export const styles = {
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16, minHeight: 40, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 0.633 },
  leftSection: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  workspaceButton: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, minHeight: 24 },
  avatar: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarInitial: { color: '#FFFFFF', fontSize: 11, fontFamily: Fonts.sansSemiBold },
  workspaceName: { fontSize: 15, fontFamily: Fonts.sansMedium, flex: 1, lineHeight: 18 },
  headerActions: { minWidth: 32, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  iconButton: { width: 32, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
} as const;
