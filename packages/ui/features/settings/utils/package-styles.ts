import { StyleSheet } from "react-native";
import { Fonts } from "@/constants/theme";
export const pkgStyles = StyleSheet.create({
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  messageText: {
    fontFamily: Fonts.sans,
    flex: 1,
  },
});
