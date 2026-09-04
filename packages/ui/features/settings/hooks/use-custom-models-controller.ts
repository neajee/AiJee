import { useCallback, useEffect, useMemo, useState } from "react";
import {  Linking, Platform  } from 'react-native';
import { useBuiltinProviders, type BuiltinProvider } from "@aijee/client-sdk";
import { useCustomModelsStore } from "../store/custom-models";

const COMMON_PROVIDER_HINTS = ["anthropic", "github-copilot", "kimi", "openai-codex", "openrouter", "radius", "xai", "google"];

export function useCustomModelsController() {
  const { providers, loaded, saving, error, parseError, load, save, addProvider, removeProvider, updateProvider } = useCustomModelsStore();
  const { providers: builtinProviders, loaded: builtinsLoaded, error: builtinsError, saveApiKey, removeApiKey, startOAuth, getOAuth, resolveOAuth, reload: reloadBuiltins } = useBuiltinProviders();
  const [adding, setAdding] = useState(false);
  const [showAllBuiltins, setShowAllBuiltins] = useState(false);
  const [activeBuiltinId, setActiveBuiltinId] = useState<string | null>(null);
  const [builtinAuthMode, setBuiltinAuthMode] = useState<'oauth' | 'apiKey'>('oauth');
  const [builtinKey, setBuiltinKey] = useState('');
  const [savingBuiltinKey, setSavingBuiltinKey] = useState(false);
  const [disconnectingBuiltinId, setDisconnectingBuiltinId] = useState<string | null>(null);
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthLoginId, setOauthLoginId] = useState<string | null>(null);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [oauthPrompt, setOauthPrompt] = useState<{ id: string; message: string } | null>(null);
  const [oauthInput, setOauthInput] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const currentSnapshot = useMemo(() => JSON.stringify(providers), [providers]);
  const dirty = savedSnapshot !== null && currentSnapshot !== savedSnapshot;

  useEffect(() => { if (!loaded) void load(); }, [loaded, load]);
  useEffect(() => { if (loaded && savedSnapshot === null) setSavedSnapshot(currentSnapshot); }, [currentSnapshot, loaded, savedSnapshot]);

  const query = providerSearch.trim().toLowerCase();
  const matchingBuiltins = useMemo(
    () => query ? builtinProviders.filter((provider) => `${provider.name} ${provider.id}`.toLowerCase().includes(query)) : builtinProviders,
    [builtinProviders, query],
  );
  const connectedBuiltins = matchingBuiltins.filter((provider) => provider.configured);
  const allAddableBuiltins = matchingBuiltins.filter((provider) => !provider.configured);
  const addableBuiltins = useMemo(() => {
    if (query || showAllBuiltins) return allAddableBuiltins;
    const rank = (provider: BuiltinProvider) => {
      const value = `${provider.id} ${provider.name}`.toLowerCase();
      const index = COMMON_PROVIDER_HINTS.findIndex((hint) => value.includes(hint));
      return index < 0 ? 100 : index;
    };
    return [...allAddableBuiltins].sort((a, b) => rank(a) - rank(b)).slice(0, 8);
  }, [allAddableBuiltins, query, showAllBuiltins]);
  const providerEntries = Object.entries(providers).filter(([name]) => !query || name.toLowerCase().includes(query));
  const canDisconnect = (provider: BuiltinProvider) =>
    provider.auth_source === 'stored credential' || provider.auth_source === 'OAuth';

  const beginOAuth = useCallback(async (providerId: string) => {
    const popup = Platform.OS === 'web' && typeof window !== 'undefined' ? window.open('', '_blank') : null;
    setOauthProviderId(providerId);
    setOauthLoginId(null);
    setOauthUrl(null);
    setOauthPrompt(null);
    setOauthInput('');
    setOauthMessage('正在准备授权…');
    try {
      const login = await startOAuth(providerId);
      setOauthLoginId(login.id);
      setOauthUrl(login.url);
      setOauthPrompt(login.prompt?.type === 'manual_code' ? { id: login.prompt.id, message: login.prompt.message } : null);
      if (login.prompt?.type === 'manual_code') setActiveBuiltinId(providerId);
      if (login.url) {
        if (popup) popup.location.href = login.url;
        else await Linking.openURL(login.url);
      }
      const check = async () => {
        let status;
        try {
          status = await getOAuth(providerId, login.id);
        } catch (error) {
          setOauthProviderId(null);
          setOauthLoginId(null);
          setOauthUrl(null);
          setOauthPrompt(null);
          setOauthInput('');
          setActiveBuiltinId(null);
          setOauthMessage(error instanceof Error ? error.message : '授权状态获取失败，请重新登录');
          return;
        }
        if (status.status === 'pending') {
          setOauthMessage(status.instructions ?? '请在浏览器中完成授权…');
          setOauthPrompt(status.prompt?.type === 'manual_code' ? { id: status.prompt.id, message: status.prompt.message } : null);
          if (status.prompt?.type === 'manual_code') setActiveBuiltinId(providerId);
          setTimeout(() => void check(), 1200);
          return;
        }
        setOauthProviderId(null);
        setOauthLoginId(null);
        setOauthUrl(null);
        setOauthPrompt(null);
        setOauthInput('');
        setOauthMessage(status.status === 'complete' ? '授权完成' : (status.error ?? '授权失败'));
        await reloadBuiltins();
      };
      void check();
    } catch (oauthError) {
      setOauthProviderId(null);
      setOauthLoginId(null);
      setOauthUrl(null);
      setOauthPrompt(null);
      setOauthInput('');
      setOauthMessage(oauthError instanceof Error ? oauthError.message : '无法启动 OAuth 登录');
    }
  }, [getOAuth, reloadBuiltins, startOAuth]);

  const disconnectBuiltin = useCallback(async (providerId: string) => {
    setDisconnectingBuiltinId(providerId);
    try {
      await removeApiKey(providerId);
      setActiveBuiltinId(null);
    } finally {
      setDisconnectingBuiltinId(null);
    }
  }, [removeApiKey]);



  return {
    providers, loaded, saving, error, parseError, save, addProvider, removeProvider, updateProvider,
    builtinProviders, builtinsLoaded, builtinsError, saveApiKey, removeApiKey, resolveOAuth,
    adding, setAdding, showAllBuiltins, setShowAllBuiltins, activeBuiltinId, setActiveBuiltinId,
    builtinAuthMode, setBuiltinAuthMode, builtinKey, setBuiltinKey, savingBuiltinKey, setSavingBuiltinKey,
    disconnectingBuiltinId, oauthProviderId, oauthLoginId, oauthMessage, oauthUrl, oauthPrompt, oauthInput, setOauthInput,
    providerSearch, setProviderSearch, savedSnapshot, setSavedSnapshot, saveMessage, setSaveMessage, currentSnapshot, dirty,
    query, connectedBuiltins, allAddableBuiltins, addableBuiltins, providerEntries, canDisconnect, beginOAuth, disconnectBuiltin,
  };
}

export type CustomModelsController = ReturnType<typeof useCustomModelsController>;
