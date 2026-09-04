import { HAIRLINE_WIDTH, ABSOLUTE_FILL_STYLE } from "@/constants/layout";
import { Platform } from 'react-native';
import { Fonts } from '@/constants/theme';
import { CARD_MIN_WIDTH } from './marketplace-constants';

export const styles = {
  page: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 52,
    paddingTop: 8, paddingBottom: 8,
    borderBottomWidth: HAIRLINE_WIDTH,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
  },
  subtitle: {
    fontFamily: Fonts.sans,
  },
  scroll: {
    flex: 1,
  },
  segmented: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  segment: {
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 5, paddingBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: HAIRLINE_WIDTH,
    borderColor: 'transparent',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingLeft: 10, paddingRight: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: Fonts.sans,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 5, paddingBottom: 5,
    borderRadius: 6,
    borderWidth: HAIRLINE_WIDTH,
  },
  centered: {
    paddingTop: 32, paddingBottom: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    paddingTop: 8, paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  card: {
    flexGrow: 1,
    minWidth: CARD_MIN_WIDTH,
    maxWidth: 560,
    minHeight: 132,
    gap: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontFamily: Fonts.sansMedium,
  },
  version: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  cardDesc: {
    fontFamily: Fonts.sans,
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  installedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  installedActions: { flexDirection: 'row', gap: 8 },
  operationMessage: {
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 8, paddingBottom: 8,
    fontSize: 12,
    fontFamily: Fonts.sans,
    borderWidth: HAIRLINE_WIDTH,
  },
  installedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'stretch',
  },
  installedCard: {
    flexGrow: 1,
    minWidth: CARD_MIN_WIDTH,
    minHeight: 112,
    justifyContent: 'space-between',
    gap: 14,
    borderWidth: HAIRLINE_WIDTH,
  },
  installedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  installedIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: HAIRLINE_WIDTH,
  },
  installedCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  installedName: {
    fontFamily: Fonts.sansMedium,
  },
  installedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'stretch',
    paddingTop: 8,
    borderTopWidth: HAIRLINE_WIDTH,
  },
  installedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 7, paddingRight: 7,
    paddingTop: 5, paddingBottom: 5,
    borderRadius: 5,
  },
  backdropWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...ABSOLUTE_FILL_STYLE,
  },
  dialog: {
    maxWidth: '100%',
    borderWidth: HAIRLINE_WIDTH,
    overflow: 'hidden',
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.22)',
    elevation: 12,
  },
  dialogInner: {
    flex: 1,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: HAIRLINE_WIDTH,
  },
  dialogTitleCol: {
    flex: 1,
    gap: 3,
  },
  dialogTitle: {
    fontFamily: Fonts.sansSemiBold,
  },
  iconButton: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 32,
    paddingLeft: 10, paddingRight: 10,
    fontSize: 13,
    fontFamily: Fonts.mono,
    borderWidth: HAIRLINE_WIDTH,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : null),
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 8, paddingBottom: 8,
  },
  commandBlock: {
    padding: 10,
    borderWidth: HAIRLINE_WIDTH,
  },
  commandText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Fonts.mono,
  },
  readme: {
    padding: 10,
    maxHeight: 220,
    maxWidth: '100%',
    overflow: 'hidden',
    borderWidth: HAIRLINE_WIDTH,
  },
  readmeText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Fonts.mono,
  },
  dialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: HAIRLINE_WIDTH,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 8, paddingRight: 8,
    paddingTop: 6, paddingBottom: 6,
    borderRadius: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 32,
    paddingLeft: 14, paddingRight: 14,
    borderWidth: HAIRLINE_WIDTH,
  },
  confirmLayer: {
    ...ABSOLUTE_FILL_STYLE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    gap: 12,
    padding: 16,
    borderWidth: HAIRLINE_WIDTH,
  },
  confirmHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
} as const;
