import { useEffect, useState } from "react";

export const Alert = {
  alert(title: string, message?: string, buttons?: Array<{ onPress?: () => void }>) {
    if (window.confirm([title, message].filter(Boolean).join("\n"))) buttons?.[0]?.onPress?.();
  },
};

export const Linking = { openURL: (url: string) => window.open(url, "_blank", "noopener,noreferrer") };
export function useSafeAreaInsets() { return { top: 0, right: 0, bottom: 0, left: 0 }; }

export function useWindowDimensions() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight, scale: 1, fontScale: 1 });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}
