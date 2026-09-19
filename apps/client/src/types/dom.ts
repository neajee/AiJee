import type React from "react";

export type StyleProp<T> = T | T[] | null | false | undefined;
export type ViewStyle = React.CSSProperties & Record<string, unknown>;
export type TextStyle = ViewStyle;
export type ImageStyle = ViewStyle;
export type TextProps = React.HTMLAttributes<HTMLSpanElement> & { style?: StyleProp<TextStyle> };
export type ViewProps = React.HTMLAttributes<HTMLDivElement> & { style?: StyleProp<ViewStyle> };
export type TextInputKeyPressEventData = { key: string };
export type NativeSyntheticEvent<T> = T & { nativeEvent: T; preventDefault?: () => void };
export type NativeScrollEvent = { contentOffset: { x: number; y: number }; layoutMeasurement: { width: number; height: number }; contentSize: { width: number; height: number } };
export type LayoutChangeEvent = NativeSyntheticEvent<{ layout: { x: number; y: number; width: number; height: number } }>;
export type AppStateStatus = "active" | "background" | "inactive";
export type AnimatedStyle<T = ViewStyle> = T;
export type ListRenderItemInfo<T> = { item: T; index: number; separators: Record<string, () => void> };
export type PanGesture = unknown;
export type View = HTMLDivElement;
export type ScrollView = HTMLDivElement;
export type TextInput = HTMLInputElement;
