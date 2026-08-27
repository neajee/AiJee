import { create } from 'zustand';
import { client } from '@pideck/client-sdk';

export interface VncBackend {
  id: string;
  name: string;
  binary: string;
  available: boolean;
}

export interface DesktopEnvironment {
  id: string;
  name: string;
  command: string;
  available: boolean;
}

export type SessionType = 'x11' | 'wayland' | 'unknown';

export interface CurrentDesktopInfo {
  display: string | null;
  desktop_session: string | null;
  running_de: string | null;
  session_type: SessionType;
}

export type DesktopMode = 'actual' | 'virtual';
export type DesktopStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface DesktopInfo {
  status: DesktopStatus;
  mode: DesktopMode | null;
  backend_id: string | null;
  de_id: string | null;
  display: string | null;
  vnc_port: number | null;
  vnc_password: string | null;
  error: string | null;
}

interface DesktopState {
  backends: VncBackend[];
  desktopEnvironments: DesktopEnvironment[];
  currentDesktop: CurrentDesktopInfo;
  desktopInfo: DesktopInfo;
  loading: boolean;
  stopping: boolean;
  backendsLoaded: boolean;
  immersive: boolean;

  fetchBackends: () => Promise<void>;
  fetchStatus: () => Promise<void>;
  startActual: () => Promise<void>;
  startVirtual: (backendId: string, deId: string, resolution?: string) => Promise<void>;
  stopDesktop: () => Promise<void>;
  setDesktopInfo: (info: any) => void;
  setImmersive: (value: boolean) => void;
  resetServerState: () => void;
}

const INITIAL_INFO: DesktopInfo = {
  status: 'stopped',
  mode: null,
  backend_id: null,
  de_id: null,
  display: null,
  vnc_port: null,
  vnc_password: null,
  error: null,
};

const INITIAL_CURRENT: CurrentDesktopInfo = {
  display: null,
  desktop_session: null,
  running_de: null,
  session_type: 'unknown',
};

let serverStateGeneration = 0;

export const useDesktopStore = create<DesktopState>((set, get) => ({
  backends: [],
  desktopEnvironments: [],
  currentDesktop: INITIAL_CURRENT,
  desktopInfo: INITIAL_INFO,
  loading: false,
  stopping: false,
  backendsLoaded: false,
  immersive: false,

  fetchBackends: async () => {
    const generation = serverStateGeneration;
    try {
      const res = await client.get({ url: '/api/desktop/backends' });
      if (generation !== serverStateGeneration) return;
      const body = res.data as any;
      if (body?.success && body.data) {
        set({
          backends: body.data.backends ?? [],
          desktopEnvironments: body.data.desktop_environments ?? [],
          currentDesktop: body.data.current_desktop ?? INITIAL_CURRENT,
          backendsLoaded: true,
        });
      }
    } catch (e) {
      console.error('Failed to fetch desktop backends:', e);
    }
  },

  fetchStatus: async () => {
    const generation = serverStateGeneration;
    try {
      const res = await client.get({ url: '/api/desktop/status' });
      if (generation !== serverStateGeneration) return;
      const body = res.data as any;
      if (body?.success && body.data) {
        set({ desktopInfo: body.data });
      }
    } catch (e) {
      console.error('Failed to fetch desktop status:', e);
    }
  },

  startActual: async () => {
    const generation = serverStateGeneration;
    set({ loading: true });
    try {
      const res = await client.post({
        url: '/api/desktop/start',
        body: { mode: 'actual' },
      });
      if (generation !== serverStateGeneration) return;
      const body = res.data as any;
      if (body?.success && body.data) {
        set({ desktopInfo: body.data, loading: false });
      } else {
        set({
          loading: false,
          desktopInfo: {
            ...get().desktopInfo,
            status: 'error',
            error: body?.error ?? 'Failed to start desktop',
          },
        });
      }
    } catch (e: any) {
      if (generation !== serverStateGeneration) return;
      set({
        loading: false,
        desktopInfo: {
          ...get().desktopInfo,
          status: 'error',
          error: e.message ?? 'Failed to start desktop',
        },
      });
    }
  },

  startVirtual: async (backendId: string, deId: string, resolution?: string) => {
    const generation = serverStateGeneration;
    set({ loading: true });
    try {
      const res = await client.post({
        url: '/api/desktop/start',
        body: {
          mode: 'virtual',
          backend_id: backendId,
          de_id: deId,
          resolution: resolution ?? null,
        },
      });
      if (generation !== serverStateGeneration) return;
      const body = res.data as any;
      if (body?.success && body.data) {
        set({ desktopInfo: body.data, loading: false });
      } else {
        set({
          loading: false,
          desktopInfo: {
            ...get().desktopInfo,
            status: 'error',
            error: body?.error ?? 'Failed to start desktop',
          },
        });
      }
    } catch (e: any) {
      if (generation !== serverStateGeneration) return;
      set({
        loading: false,
        desktopInfo: {
          ...get().desktopInfo,
          status: 'error',
          error: e.message ?? 'Failed to start desktop',
        },
      });
    }
  },

  setDesktopInfo: (info: any) => {
    set({ desktopInfo: info });
  },

  setImmersive: (value: boolean) => {
    set({ immersive: value });
  },

  stopDesktop: async () => {
    const generation = serverStateGeneration;
    set({ stopping: true });
    try {
      const res = await client.post({ url: '/api/desktop/stop' });
      if (generation !== serverStateGeneration) return;
      const body = res.data as any;
      if (body?.success) {
        set({ desktopInfo: INITIAL_INFO, stopping: false });
      } else {
        set({ stopping: false });
      }
    } catch (e) {
      if (generation !== serverStateGeneration) return;
      console.error('Failed to stop desktop:', e);
      set({ stopping: false });
    }
  },

  resetServerState: () => {
    ++serverStateGeneration;
    set({
      backends: [],
      desktopEnvironments: [],
      currentDesktop: INITIAL_CURRENT,
      desktopInfo: INITIAL_INFO,
      loading: false,
      stopping: false,
      backendsLoaded: false,
      immersive: false,
    });
  },
}));
