import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { ChevronDown, ChevronUp, LogIn, LogOut, Plus } from 'lucide-react-native';
import { useBuiltinProviders, type BuiltinProvider } from '@aijee/client-sdk';
import { useCustomModelsStore } from '../store/custom-models';
import { useSettingsHeadingVisible } from './settings-list';
import { AddProviderForm, Field } from './custom-models-form';
import { ModelSection, ProviderRow, RowDivider, CustomProviderRow } from './custom-models-provider-list';
import { useColors } from './custom-models-theme';
import { providerPageStyles } from './custom-models-styles';

const COMMON_PROVIDER_HINTS = ['anthropic', 'github-copilot', 'kimi', 'openai-codex', 'openrouter', 'radius', 'xai', 'google'];

export function CustomModelsSection({ isDark, isNative }: { isDark: boolean; isNative?: boolean }) {
  const colors = useColors(isDark, isNative);
  const headingVisible = useSettingsHeadingVisible();
  const { providers, loaded, saving, error, parseError, load, save, addProvider, removeProvider, updateProvider } = useCustomModelsStore();
  const { providers: builtinProviders, loaded: builtinsLoaded, error: builtinsError, saveApiKey, removeApiKey, startOAuth, getOAuth, reload: reloadBuiltins } = useBuiltinProviders();
  const [adding, setAdding] = useState(false);
  const [showAllBuiltins, setShowAllBuiltins] = useState(false);
  const [activeBuiltinId, setActiveBuiltinId] = useState<string | null>(null);
  const [builtinKey, setBuiltinKey] = useState('');
  const [savingBuiltinKey, setSavingBuiltinKey] = useState(false);
  const [disconnectingBuiltinId, setDisconnectingBuiltinId] = useState<string | null>(null);
  const [oauthProviderId, setOauthProviderId] = useState<string | null>(null);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
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
    setOauthProviderId(providerId);
    setOauthMessage('正在准备授权…');
    try {
      const login = await startOAuth(providerId);
      setOauthUrl(login.url);
      const check = async () => {
        const status = await getOAuth(providerId, login.id);
        if (status.status === 'pending') {
          setOauthMessage(status.instructions ?? '请在浏览器中完成授权…');
          setTimeout(() => void check(), 1200);
          return;
        }
        setOauthProviderId(null);
        setOauthUrl(null);
        setOauthMessage(status.status === 'complete' ? '授权完成' : (status.error ?? '授权失败'));
        await reloadBuiltins();
      };
      void check();
    } catch (oauthError) {
      setOauthProviderId(null);
      setOauthUrl(null);
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

  const renderBuiltinPanel = (provider: BuiltinProvider) => activeBuiltinId === provider.id ? (
    <View style={[providerPageStyles.inlinePanel, { borderTopColor: colors.separator }]}>
      {!provider.configured && provider.supports_oauth ? (
        <Pressable disabled={oauthProviderId === provider.id} onPress={() => void beginOAuth(provider.id)} style={({ pressed }) => [providerPageStyles.secondaryButton, { borderColor: colors.borderColor }, pressed && { backgroundColor: colors.pressedBg }]}>
          <LogIn size={15} color={colors.textSecondary} />
          <Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</Text>
        </Pressable>
      ) : null}
      {provider.supports_api_key ? <Field label={`${provider.name} API Key`} value={builtinKey} onChangeText={setBuiltinKey} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} /> : null}
      <View style={providerPageStyles.panelActions}>
        {provider.configured && canDisconnect(provider) ? (
          <Pressable onPress={() => void disconnectBuiltin(provider.id)} style={({ pressed }) => [providerPageStyles.textButton, pressed && { opacity: 0.6 }]} accessibilityRole="button">
            <Text style={[providerPageStyles.linkText, { color: colors.dangerColor }]}>断开连接</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setActiveBuiltinId(null)} style={[providerPageStyles.secondaryButton, { borderColor: colors.borderColor }]}><Text style={[providerPageStyles.linkText, { color: colors.textSecondary }]}>取消</Text></Pressable>
        {provider.supports_api_key ? (
          <Pressable disabled={!builtinKey.trim() || savingBuiltinKey} onPress={() => { setSavingBuiltinKey(true); void saveApiKey(provider.id, builtinKey).then(() => { setBuiltinKey(''); setActiveBuiltinId(null); }).finally(() => setSavingBuiltinKey(false)); }} style={[providerPageStyles.primaryButton, { backgroundColor: colors.actionBg }, (!builtinKey.trim() || savingBuiltinKey) && { opacity: 0.45 }]}>
            <Text style={[providerPageStyles.linkText, { color: colors.actionText }]}>{savingBuiltinKey ? '保存中…' : '保存 Key'}</Text>
          </Pressable>
        ) : null}
      </View>
      {oauthMessage ? <Text accessibilityRole="alert" style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{oauthMessage}</Text> : null}
      {oauthUrl ? <Pressable onPress={() => void Linking.openURL(oauthUrl)} accessibilityRole="link"><Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>打开授权页</Text></Pressable> : null}
      {provider.configured && !canDisconnect(provider) ? (
        <Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>
          由 {provider.auth_source} 配置；请从启动 AiJee 的环境中移除后重启运行时。
        </Text>
      ) : null}
    </View>
  ) : null;

  if (!loaded || !builtinsLoaded) {
    return <Text style={[providerPageStyles.message, { color: colors.textMuted }]}>正在加载模型服务…</Text>;
  }
  if (parseError || builtinsError) {
    return <Text accessibilityRole="alert" style={[providerPageStyles.message, { color: colors.textPrimary }]}>{parseError ? `无法读取 models.json：${parseError}` : builtinsError}</Text>;
  }

  return (
    <View style={providerPageStyles.page}>
      {headingVisible ? (
        <View style={providerPageStyles.pageHeading}>
          <Text style={[providerPageStyles.pageTitle, { color: colors.textPrimary }]}>模型服务</Text>
          <Text style={[providerPageStyles.pageSubtitle, { color: colors.textMuted }]}>模型接入点、凭据与聊天模型列表</Text>
        </View>
      ) : null}

      <TextInput
        value={providerSearch}
        onChangeText={setProviderSearch}
        placeholder="搜索模型服务"
        placeholderTextColor={colors.placeholder}
        accessibilityLabel="搜索模型服务"
        style={[providerPageStyles.search, { color: colors.textPrimary, backgroundColor: colors.inputBg, borderColor: colors.borderColor }]}
      />

      <ModelSection title={`已连接 (${connectedBuiltins.length})`} colors={colors}>
        {connectedBuiltins.length ? connectedBuiltins.map((provider, index) => (
          <View key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
              <ProviderRow
                name={provider.name}
                id={provider.id}
                connected
                meta={Number.isFinite(provider.model_count) ? `${provider.model_count} 个模型${provider.auth_source ? ` · ${provider.auth_source}` : ''}` : provider.auth_source}
                colors={colors}
                onPress={() => { setBuiltinKey(''); setActiveBuiltinId((id) => id === provider.id ? null : provider.id); }}
                trailing={canDisconnect(provider) ? (
                  <Pressable
                    disabled={disconnectingBuiltinId === provider.id}
                    onPress={(event) => {
                      event.stopPropagation?.();
                      void disconnectBuiltin(provider.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`断开 ${provider.name}`}
                    style={({ pressed }) => [providerPageStyles.iconAction, pressed && { backgroundColor: colors.pressedBg }, disconnectingBuiltinId === provider.id && { opacity: 0.5 }]}
                  >
                    <LogOut size={15} color={colors.textMuted} strokeWidth={1.8} />
                  </Pressable>
                ) : null}
              />
            {renderBuiltinPanel(provider)}
          </View>
        )) : (
          <View style={providerPageStyles.emptyRow}><Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>尚未连接服务，从下方选择一个即可开始。</Text></View>
        )}
      </ModelSection>

      <ModelSection title="可添加" colors={colors}>
        {addableBuiltins.map((provider, index) => (
          <View key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
            <ProviderRow name={provider.name} id={provider.id} meta={!provider.supports_oauth && provider.supports_api_key ? '需要 API Key' : null} colors={colors} onPress={() => { setBuiltinKey(''); setActiveBuiltinId((id) => id === provider.id ? null : provider.id); }} />
            {renderBuiltinPanel(provider)}
          </View>
        ))}
        {!query && allAddableBuiltins.length > 8 ? (
          <>
            <RowDivider colors={colors} />
            <Pressable onPress={() => setShowAllBuiltins((value) => !value)} accessibilityRole="button" style={({ pressed, hovered }: any) => [providerPageStyles.foldRow, (pressed || hovered) && { backgroundColor: colors.pressedBg }]}>
              <Text style={[providerPageStyles.foldText, { color: colors.textSecondary }]}>{showAllBuiltins ? '收起提供商' : `显示全部 ${allAddableBuiltins.length} 个提供商`}</Text>
              {showAllBuiltins ? (
                <ChevronUp size={14} color={colors.textMuted} strokeWidth={1.8} />
              ) : (
                <ChevronDown size={14} color={colors.textMuted} strokeWidth={1.8} />
              )}
            </Pressable>
          </>
        ) : null}
      </ModelSection>

      <ModelSection title="自定义服务" colors={colors}>
        {providerEntries.map(([name, provider], index) => (
          <View key={name}>
            {index ? <RowDivider colors={colors} /> : null}
            <CustomProviderRow name={name} provider={provider} colors={colors} onUpdate={(next) => updateProvider(name, next)} onRemove={() => removeProvider(name)} />
          </View>
        ))}
        {providerEntries.length ? <RowDivider colors={colors} /> : null}
        {adding ? (
          <View style={providerPageStyles.inlinePanel}><AddProviderForm colors={colors} onAdd={(name, baseUrl, api) => { void addProvider(name, { baseUrl: baseUrl || undefined, api, models: [] }); setAdding(false); }} onCancel={() => setAdding(false)} /></View>
        ) : (
          <Pressable onPress={() => setAdding(true)} accessibilityRole="button" accessibilityLabel="添加提供商" style={({ pressed, hovered }: any) => [providerPageStyles.addRow, (pressed || hovered) && { backgroundColor: colors.pressedBg }]}>
            <Plus size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={[providerPageStyles.rowName, { color: colors.textSecondary }]}>添加提供商</Text>
          </Pressable>
        )}
      </ModelSection>

      {dirty ? (
        <View style={[providerPageStyles.saveBar, { backgroundColor: colors.cardBg, borderTopColor: colors.separator }]}>
          <Pressable disabled={saving} onPress={() => { setSaveMessage(null); void save(providers).then(() => { if (!useCustomModelsStore.getState().error) { setSavedSnapshot(currentSnapshot); setSaveMessage('已保存'); setTimeout(() => setSaveMessage(null), 1800); } }); }} accessibilityRole="button" accessibilityLabel="保存更改" style={({ pressed, hovered }: any) => [providerPageStyles.saveButton, { backgroundColor: colors.actionBg }, (pressed || hovered) && { opacity: 0.86 }, saving && { opacity: 0.5 }]}>
            <Text style={[providerPageStyles.saveButtonText, { color: colors.actionText }]}>{saving ? '保存中…' : '保存更改'}</Text>
          </Pressable>
        </View>
      ) : null}
      {saveMessage ? <Text accessibilityRole="alert" style={[providerPageStyles.feedback, { color: colors.successColor }]}>{saveMessage}</Text> : null}
      {error && !saving ? <Text accessibilityRole="alert" style={[providerPageStyles.feedback, { color: colors.dangerColor }]}>{error}</Text> : null}
    </View>
  );
}

// ─── Styles: web 紧凑版 ───────────────────────────────────────
