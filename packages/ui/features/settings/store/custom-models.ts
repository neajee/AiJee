import { create } from 'zustand';
import { sdk, unwrapApiData, extractApiErrorMessage } from '@aijee/client-sdk';
import type {
  CustomProvider,
  CustomModelEntry,
  CustomModelsConfigResult,
} from '@aijee/client-sdk';
const { getCustomModels, saveCustomModels } = sdk;

export type { CustomProvider, CustomModelEntry };

export type ProvidersMap = Record<string, CustomProvider>;

interface CustomModelsState {
  providers: ProvidersMap;
  loaded: boolean;
  saving: boolean;
  error: string | null;
  /**
   * Set when models.json exists but could not be read. Editing is blocked in
   * that state: an empty provider list here means "unknown", not "none", and
   * saving would wipe the file.
   */
  parseError: string | null;

  load: () => Promise<void>;
  save: (providers: ProvidersMap) => Promise<void>;
  addProvider: (name: string, provider: CustomProvider) => Promise<void>;
  removeProvider: (name: string) => Promise<void>;
  updateProvider: (name: string, provider: CustomProvider) => Promise<void>;
}

export const useCustomModelsStore = create<CustomModelsState>((set, get) => ({
  providers: {},
  loaded: false,
  saving: false,
  error: null,
  parseError: null,

  load: async () => {
    try {
      const result = await getCustomModels();
      const data = unwrapApiData(result.data) as
        | CustomModelsConfigResult
        | undefined;
      set({
        providers: data?.providers ?? {},
        loaded: true,
        error: null,
        parseError: data?.parseError ?? null,
      });
    } catch (e) {
      set({ loaded: true, error: extractApiErrorMessage(e, '加载自定义模型失败') });
    }
  },

  save: async (providers) => {
    if (get().parseError) {
      set({ error: '本地 models.json 无法解析，为避免覆盖已停止保存。' });
      return;
    }
    set({ saving: true, error: null });
    try {
      await saveCustomModels({ body: { providers } });
      set({ providers, saving: false });
    } catch (e) {
      set({ saving: false, error: extractApiErrorMessage(e, '保存自定义模型失败') });
    }
  },

  addProvider: async (name, provider) => {
    const providers = { ...get().providers, [name]: provider };
    await get().save(providers);
  },

  removeProvider: async (name) => {
    const { [name]: _, ...rest } = get().providers;
    await get().save(rest);
  },

  updateProvider: async (name, provider) => {
    const providers = { ...get().providers, [name]: provider };
    await get().save(providers);
  },
}));
