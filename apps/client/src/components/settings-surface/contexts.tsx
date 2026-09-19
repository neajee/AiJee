import { createContext, useContext, type ReactNode } from 'react';

const LayoutContext = createContext<boolean | null>(null);
const HeadingContext = createContext(true);

export function SettingsLayoutProvider({ phone, children }: { phone: boolean; children: ReactNode }) {
  return <LayoutContext.Provider value={phone}>{children}</LayoutContext.Provider>;
}

export function useSettingsLayout(): boolean | null {
  return useContext(LayoutContext);
}

export function SettingsHeadingProvider({ visible, children }: { visible: boolean; children: ReactNode }) {
  return <HeadingContext.Provider value={visible}>{children}</HeadingContext.Provider>;
}

export function useSettingsHeadingVisible(): boolean {
  return useContext(HeadingContext);
}
