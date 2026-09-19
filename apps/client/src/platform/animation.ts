import { useMemo } from "react";

const operation = (value: any) => ({ value, start: (done?: (result: { finished: boolean }) => void) => done?.({ finished: true }), stop() {}, interpolate: () => value });
export const Animated: any = { Value: class { value: number; constructor(value: number) { this.value = value; } interpolate = () => this.value; }, timing: operation, spring: operation, sequence: operation, parallel: operation, loop: operation, delay: operation, multiply: (a: any, b: number) => (a?.value ?? a) * b, subtract: (a: any, b: number) => (a?.value ?? a) - b };
export default Animated;
export const Easing: any = { cubic: (value: number) => value, out: (value: any) => value, linear: (value: number) => value };
export const useAnimatedStyle = (factory: () => any) => useMemo(factory, [factory]);
export const useSharedValue = <T,>(value: T) => ({ value });
export const withTiming = <T,>(value: T) => value;
export const runOnJS = (fn: Function) => fn;
export const Gesture = { Pan: () => ({ onUpdate() { return this; }, onEnd() { return this; }, activeOffsetY() { return this; } }) };
export const PanResponder = { create: (_config: unknown) => ({ panHandlers: {} }) };
