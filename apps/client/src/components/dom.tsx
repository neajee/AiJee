import React, { forwardRef, useEffect, useState } from "react";

export type StyleProp<T> = T | T[] | null | false | undefined;
export type ViewStyle = React.CSSProperties & Record<string, unknown>;
export type TextStyle = ViewStyle;
export type ImageStyle = ViewStyle;
export type TextProps = React.HTMLAttributes<HTMLSpanElement> & { style?: StyleProp<TextStyle>; children?: React.ReactNode };
export type ViewProps = React.HTMLAttributes<HTMLDivElement> & { style?: StyleProp<ViewStyle>; children?: React.ReactNode };
export type TextInputKeyPressEventData = { key: string };
export type NativeSyntheticEvent<T> = T & { nativeEvent: T; preventDefault?: () => void };
export type NativeScrollEvent = { contentOffset: { x: number; y: number }; layoutMeasurement: { width: number; height: number }; contentSize: { width: number; height: number } };
export type LayoutChangeEvent = NativeSyntheticEvent<{ layout: { x: number; y: number; width: number; height: number } }>;
export type AppStateStatus = "active" | "background" | "inactive";
export type AnimatedStyle = ViewStyle;
export type ListRenderItemInfo<T> = { item: T; index: number; separators: { highlight(): void; unhighlight(): void; updateProps(): void } };

function flattenStyle(style: any): React.CSSProperties {
  const values = Array.isArray(style) ? style : [style];
  return Object.assign({}, ...values.filter(Boolean));
}

function normalizeProps(props: any, ref?: any) {
  const { style, onPress, onPressIn, onPressOut, onChangeText, onSubmitEditing, accessibilityLabel, accessibilityRole, testID, ...rest } = props ?? {};
  const next: any = { ...rest, ref, style: flattenStyle(style) };
  if (onPress) next.onClick = (event: React.MouseEvent) => onPress(event);
  if (onPressIn) next.onMouseDown = onPressIn;
  if (onPressOut) next.onMouseUp = onPressOut;
  if (onChangeText) next.onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText(event.target.value);
  if (onSubmitEditing) next.onKeyDown = (event: React.KeyboardEvent) => event.key === "Enter" && onSubmitEditing(event);
  if (accessibilityLabel) next["aria-label"] = accessibilityLabel;
  if (accessibilityRole) next["role"] = accessibilityRole;
  if (testID) next["data-testid"] = testID;
  return next;
}

function element(tag: keyof React.JSX.IntrinsicElements, props: any, ref?: any) {
  const { children, ...rest } = props ?? {};
  return React.createElement(tag, normalizeProps(rest, ref), typeof children === "function" ? children({ pressed: false }) : children);
}

export const View = forwardRef<HTMLDivElement, any>((props, ref) => element("div", props, ref));
export const Text = forwardRef<HTMLSpanElement, any>((props, ref) => element("span", props, ref));
export const Pressable = forwardRef<HTMLButtonElement, any>((props, ref) => element("button", { type: "button", ...props }, ref));
export const SafeAreaView = View;
export const KeyboardAvoidingView = View;
export const GestureHandlerRootView = View;
export const ScrollView = forwardRef<HTMLDivElement, any>((props, ref) => element("div", { ...props, style: [{ overflow: "auto" }, props.style] }, ref));
export const Input = forwardRef<HTMLInputElement, any>((props, ref) => element("input", props, ref));
export const TextInput = forwardRef<HTMLInputElement, any>((props, ref) => element("input", props, ref));
export const TextArea = forwardRef<HTMLTextAreaElement, any>((props, ref) => element("textarea", props, ref));
export const Image = forwardRef<HTMLImageElement, any>(({ source, src, alt = "", ...props }, ref) => {
  const value = typeof source === "string" ? source : source?.uri ?? src;
  return <img ref={ref} src={value} alt={alt} {...normalizeProps(props)} />;
});
export const Modal = ({ visible, children, onRequestClose, ...props }: any) => visible === false ? null : <div role="dialog" aria-modal="true" {...normalizeProps(props)}>{children}</div>;
export const Spinner = ({ size = "small", ...props }: any) => <span aria-label="loading" {...normalizeProps(props)}>{size === "large" ? "◌" : "·"}</span>;
export const ActivityIndicator = Spinner;
export const Switch = ({ value, onValueChange, ...props }: any) => <input type="checkbox" checked={!!value} onChange={(event) => onValueChange?.(event.target.checked)} {...normalizeProps(props)} />;

export function FlatList<T>({ data = [], renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, ...props }: any) {
  return <div {...normalizeProps(props)}>{ListHeaderComponent}{data.length ? data.map((item: T, index: number) => <React.Fragment key={keyExtractor?.(item, index) ?? index}>{renderItem?.({ item, index, separators: {} })}</React.Fragment>) : ListEmptyComponent}</div>;
}

export const StyleSheet = { create: <T extends object>(styles: T): T => styles, flatten: flattenStyle, hairlineWidth: 1 };
export const Platform = { OS: "web", select: <T,>(values: { web?: T; default?: T; ios?: T; android?: T }) => values.web ?? values.default ?? values.ios ?? values.android };
export const Dimensions = { get: (_name: string) => ({ width: window.innerWidth, height: window.innerHeight }) };
export function useWindowDimensions() { const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 }); useEffect(() => { const fn = () => setSize({ width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 }); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []); return size; }
export function useColorScheme(): "light" | "dark" { return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
export function useSafeAreaInsets() { return { top: 0, right: 0, bottom: 0, left: 0 }; }
export const SafeAreaProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const Provider = (props: any) => <>{props.children}</>;

export const Keyboard = { dismiss: () => document.activeElement instanceof HTMLElement && document.activeElement.blur(), addListener: () => ({ remove() {} }) };
export const Linking = { openURL: (url: string) => window.open(url, "_blank", "noopener,noreferrer") };
export const Alert = { alert: (title: string, message?: string, buttons?: Array<{ text?: string; onPress?: () => void }>) => { if (window.confirm([title, message].filter(Boolean).join("\n"))) buttons?.[0]?.onPress?.(); } };
export const AppState = { currentState: "active" as AppStateStatus, addEventListener: (_event: string, _handler: (state: AppStateStatus) => void) => ({ remove() {} }) };
export const LayoutAnimation = { configureNext: (_config?: unknown, callback?: () => void) => callback?.(), create: (..._args: any[]) => ({}), Types: { easeInEaseOut: "easeInEaseOut", linear: "linear" }, Properties: { opacity: "opacity" }, keyboard: "keyboard" };
export const PanResponder = { create: (_config: unknown) => ({ panHandlers: {} }) };

const animation = (value: any) => ({ start: (callback?: (result?: { finished: boolean }) => void) => callback?.({ finished: true }), stop: () => {}, reset: () => {}, _value: value, value, interpolate: (_config: any) => value });
export const Animated: any = { View, Text, Value: class { value: number; constructor(value: number) { this.value = value; } interpolate = (_config: any) => this.value; }, timing: animation, spring: animation, sequence: (items: any[]) => animation(items), parallel: (items: any[]) => animation(items), loop: animation, delay: animation, multiply: (a: any, b: any) => (a?.value ?? a) * b, subtract: (a: any, b: any) => (a?.value ?? a) - b, create: (component: any) => component };
export default Animated;
export const Easing: any = { linear: (x: number) => x, ease: (x: number) => x, in: (fn: any) => fn, out: (fn: any) => fn, inOut: (fn: any) => fn, cubic: (x: number) => x, bezier: (..._args: number[]) => (x: number) => x };
export const FadeIn: any = { duration: (_ms: number) => FadeIn };
export const FadeOut: any = { duration: (_ms: number) => FadeOut };
export const LinearTransition: any = { duration: (_ms: number) => LinearTransition, springify: () => LinearTransition };
export const Gesture = { Pan: () => ({ onUpdate() { return this; }, onEnd() { return this; }, enabled() { return this; } }) };
export const GestureDetector = ({ children }: { children?: React.ReactNode; gesture?: unknown }) => <>{children}</>;
export const runOnJS = (fn: Function) => fn;
export const useSharedValue = <T,>(value: T) => ({ value });
export const useAnimatedStyle = (factory: () => any) => factory();
export const useDerivedValue = (factory: () => any) => ({ value: factory() });
export const withTiming = <T,>(value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const withSequence = <T,>(...values: T[]) => values.at(-1);
export const withDelay = <T,>(_delay: number, value: T) => value;
export const interpolate = (value: number, input: number[], output: number[]) => output[input.indexOf(value)] ?? output[0];

export type TextInputElement = HTMLInputElement;
export type ViewElement = HTMLDivElement;
