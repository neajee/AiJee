import { create } from "zustand";

type PanelSide = "left" | "right";

interface PanelCoordinationState {
  openedSide: PanelSide | null;
  revision: number;
  notifyOpened: (side: PanelSide) => void;
}

export const usePanelCoordination = create<PanelCoordinationState>((set) => ({
  openedSide: null,
  revision: 0,
  notifyOpened: (openedSide) =>
    set((state) => ({ openedSide, revision: state.revision + 1 })),
}));
