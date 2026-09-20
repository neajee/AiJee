import { useMemo, useReducer, useRef } from "react";

export class AnimatedValue {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
  setValue(value: number) {
    this.value = value;
  }
  stopAnimation() {}
  interpolate(_config?: unknown) {
    return this.value;
  }
}

export interface AnimationHandle {
  value: unknown;
  start(callback?: (result: { finished: boolean }) => void): void;
  stop(): void;
  reset(): void;
}

const animation = (value: unknown, _config?: unknown): AnimationHandle => ({
  value,
  start(callback) {
    callback?.({ finished: true });
  },
  stop() {},
  reset() {},
});

export class Animated {
  static Value = AnimatedValue;
  static timing = (value: unknown, config?: unknown) => animation(value, config);
  static spring = (value: unknown, config?: unknown) => animation(value, config);
  static sequence = (items: unknown) => animation(items);
  static parallel = (items: unknown) => animation(items);
  static stagger = (_delay: number, items: unknown) => animation(items);
  static loop = (item: unknown, config?: unknown) => animation(item, config);
  static delay = (value: unknown, _delay?: number) => animation(value);
  static multiply = (a: { value?: number } | number, b: number) =>
    (typeof a === "number" ? a : a?.value ?? 0) * b;
  static subtract = (a: { value?: number } | number, b: number) =>
    (typeof a === "number" ? a : a?.value ?? 0) - b;
}

export namespace Animated {
  export type Value = AnimatedValue;
  export type Handle = AnimationHandle;
}

export default Animated;

const identityEasing = (value: number) => value;
export const Easing = {
  cubic: identityEasing,
  ease: identityEasing,
  linear: identityEasing,
  in: (easing: (value: number) => number) => easing,
  out: (easing: (value: number) => number) => easing,
  inOut: (easing: (value: number) => number) => easing,
  bezier: () => identityEasing,
};

export interface TransitionDescriptor {
  duration(_ms: number): TransitionDescriptor;
  springify(): TransitionDescriptor;
  damping(_value: number): TransitionDescriptor;
  stiffness(_value: number): TransitionDescriptor;
  mass(_value: number): TransitionDescriptor;
}
const transition: TransitionDescriptor = {
  duration: () => transition,
  springify: () => transition,
  damping: () => transition,
  stiffness: () => transition,
  mass: () => transition,
};
export const FadeIn = transition;
export const FadeOut = transition;
export const LinearTransition = transition;

export interface SharedValue<T> {
  value: T;
  setValue(value: T): void;
}

export function useSharedValue<T>(initial: T): SharedValue<T> {
  const [, forceRender] = useReducer((n: number) => n + 1, 0);
  const ref = useRef<SharedValue<T> | null>(null);
  if (ref.current === null) {
    let current = initial;
    ref.current = {
      get value() {
        return current;
      },
      set value(next: T) {
        current = next;
        forceRender();
      },
      setValue(next: T) {
        current = next;
        forceRender();
      },
    };
  }
  return ref.current;
}

export function useAnimatedStyle<T>(factory: () => T): T {
  const value = useMemo(factory, [factory]);
  return value;
}

export function useDerivedValue<T>(factory: () => T): { value: T } {
  return useMemo(() => ({ value: factory() }), [factory]);
}

export function withTiming<T>(value: T, _config?: unknown): T {
  return value;
}
export function withSpring<T>(value: T, _config?: unknown): T {
  return value;
}
export function withRepeat<T>(value: T, _count?: number, _reverse?: boolean): T {
  return value;
}
export function withSequence<T>(...values: T[]): T {
  return values.at(-1) as T;
}
export function withDelay<T>(_delay: number, value: T): T {
  return value;
}

export function interpolate(value: number, input: number[], output: number[]): number {
  if (input.length === 0) return value;
  const index = input.findIndex((v) => v >= value);
  if (index <= 0) return output[0];
  return output[index] ?? output[output.length - 1];
}

export function runOnJS<F extends (...args: never[]) => unknown>(fn: F): F {
  return fn;
}

export const Gesture = {
  Pan: () => ({
    onUpdate() {
      return this;
    },
    onEnd() {
      return this;
    },
    onBegin() {
      return this;
    },
    activeOffsetY() {
      return this;
    },
    enabled() {
      return this;
    },
  }),
};

export const PanResponder = {
  create: (_config: unknown) => ({ panHandlers: {} as Record<string, unknown> }),
};

export const LayoutAnimation = {
  configureNext: (_config?: unknown, callback?: () => void) => callback?.(),
  create: () => ({}),
  Types: { easeInEaseOut: "easeInEaseOut", linear: "linear" },
  Properties: { opacity: "opacity" },
};
