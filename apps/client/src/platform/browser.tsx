import { useEffect, useState, type ReactNode } from "react";
export const Alert = {
  alert(title: string, message?: string, buttons?: Array<{
    onClick?: () => void;
  }>) {
    if (window.confirm([title, message].filter(Boolean).join("\n"))) buttons?.[0]?.onClick?.();
  }
};
export const Linking = {
  openURL: (url: string) => window.open(url, "_blank", "noopener,noreferrer")
};
export function useSafeAreaInsets() {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };
}
export function useColorScheme(): "light" | "dark" {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export const Keyboard = {
  dismiss: () => document.activeElement instanceof HTMLElement && document.activeElement.blur(),
  addListener: () => ({
    remove() {}
  })
};
export const AppState = {
  currentState: "active" as const,
  addEventListener: () => ({
    remove() {}
  })
};
export const Dimensions = {
  get: () => ({
    width: window.innerWidth,
    height: window.innerHeight
  })
};
export const Platform = {
  OS: "web",
  select: <T,>(values: {
    web?: T;
    default?: T;
  }) => values.web ?? values.default
};
export const StyleSheet = {
  create: <T extends object,>(styles: T): T => styles,
  flatten: (style: unknown) => style,
  hairlineWidth: 1
};
export const LayoutAnimation = {
  configureNext: (_config?: unknown, callback?: () => void) => callback?.(),
  create: (_duration?: number, _type?: string, _property?: string) => ({}),
  Types: { easeInEaseOut: "easeInEaseOut", linear: "linear", keyboard: "keyboard" },
  Properties: { opacity: "opacity" }
};
export const SafeAreaProvider = ({
  children
}: {
  children?: ReactNode;
}) => <>{children}</>;
export function useWindowDimensions() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    fontScale: 1
  });
  useEffect(() => {
    const update = () => setSize({
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 1,
      fontScale: 1
    });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}
