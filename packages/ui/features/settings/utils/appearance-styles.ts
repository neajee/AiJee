import { StyleSheet } from "react-native";

export const pickerStyles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  labeledGroup: {
    gap: 3,
  },
  wideGroup: {
    maxWidth: '100%',
    gap: 3,
    padding: 3,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  wideItem: {
    flex: 1,
    minHeight: 42,
    flexDirection: 'row',
    gap: 7,
    borderRadius: 7,
  },
});
