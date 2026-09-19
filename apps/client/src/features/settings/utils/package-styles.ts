import { Fonts } from "@/constants/theme";
export const pkgStyles = {
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingLeft: 12, paddingRight: 12,
    paddingTop: 6, paddingBottom: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: Fonts.sansSemiBold,
  },
  upToDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upToDateText: {
    fontSize: 13,
    fontFamily: Fonts.sansMedium,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
    paddingLeft: 10, paddingRight: 10,
    paddingTop: 7, paddingBottom: 7,
    borderRadius: 6,
  },
  messageText: {
    fontFamily: Fonts.sans,
    flex: 1,
  },
} as const;
