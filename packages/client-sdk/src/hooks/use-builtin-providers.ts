import { useCallback, useEffect, useRef } from "react";
import { BehaviorSubject } from "rxjs";
import { usePiClient } from "./context";
import { useObservable } from "./use-observable";
import type { BuiltinProvider } from "../types";

type State = { providers: BuiltinProvider[]; loaded: boolean; error: string | null };
const INITIAL: State = { providers: [], loaded: false, error: null };

/** Live Pi SDK catalogue, separated from user-defined providers. */
export function useBuiltinProviders() {
  const client = usePiClient();
  const state$ = useRef(new BehaviorSubject<State>(INITIAL));
  const load = useCallback(async () => {
    try {
      const providers = await client.api.listBuiltinProviders();
      state$.current.next({ providers, loaded: true, error: null });
    } catch (error) {
      state$.current.next({ ...state$.current.value, loaded: true, error: error instanceof Error ? error.message : "加载内置提供商失败" });
    }
  }, [client]);
  useEffect(() => { void load(); }, [load]);
  const saveApiKey = useCallback(async (providerId: string, apiKey: string) => { await client.api.saveBuiltinProviderKey(providerId, apiKey); await load(); }, [client, load]);
  const removeApiKey = useCallback(async (providerId: string) => { await client.api.removeBuiltinProviderKey(providerId); await load(); }, [client, load]);
  const startOAuth = useCallback((providerId: string) => client.api.startProviderOAuth(providerId), [client]);
  const getOAuth = useCallback((providerId: string, loginId: string) => client.api.getProviderOAuth(providerId, loginId), [client]);
  const resolveOAuth = useCallback((providerId: string, loginId: string, promptId: string, value: string) => client.api.resolveProviderOAuthPrompt(providerId, loginId, promptId, value), [client]);
  return { ...useObservable(state$.current, INITIAL), reload: load, saveApiKey, removeApiKey, startOAuth, getOAuth, resolveOAuth };
}
