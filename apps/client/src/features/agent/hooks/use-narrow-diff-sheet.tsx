import { createContext, useContext, type ReactNode } from "react";

const NarrowDiffSheetContext = createContext<null>(null);

export function NarrowDiffSheetProvider({ children }: { children: ReactNode }) {
  return (
    <NarrowDiffSheetContext.Provider value={null}>
      {children}
    </NarrowDiffSheetContext.Provider>
  );
}

export function useNarrowDiffSheet() {
  return useContext(NarrowDiffSheetContext);
}
