import { Linking } from "@/platform/browser";
import { ChevronDown, ChevronUp, KeyRound, LogIn, LogOut, Plus, X } from "lucide-react";
import type { BuiltinProvider } from "@aijee/client-sdk";
import { useCustomModelsStore } from "../../store/custom-models";
import { useSettingsHeadingVisible } from "@/components/settings-surface";
import { AddProviderForm, Field } from "../custom-models-form";
import { ModelSection, ProviderMark, ProviderRow, RowDivider, CustomProviderRow } from "../custom-models-provider-list";
import { useColors } from "../../hooks/use-custom-models-theme";
import { fieldNativeStyles, fieldWebStyles, providerPageStyles } from "../../utils/custom-models-styles";
import { AppModal } from "@/components/ui";
import type { CustomModelsController } from "../../hooks/use-custom-models-controller";
export function CustomModelsView({
  controller,
  isDark,
  isNative
}: {
  controller: CustomModelsController;
  isDark: boolean;
  isNative?: boolean;
}) {
  const colors = useColors(isDark, isNative);
  const headingVisible = useSettingsHeadingVisible();
  const {
    providers,
    loaded,
    saving,
    error,
    parseError,
    save,
    addProvider,
    removeProvider,
    updateProvider,
    builtinProviders,
    builtinsLoaded,
    builtinsError,
    saveApiKey,
    resolveOAuth,
    adding,
    setAdding,
    showAllBuiltins,
    setShowAllBuiltins,
    activeBuiltinId,
    setActiveBuiltinId,
    builtinAuthMode,
    setBuiltinAuthMode,
    builtinKey,
    setBuiltinKey,
    savingBuiltinKey,
    setSavingBuiltinKey,
    disconnectingBuiltinId,
    oauthProviderId,
    oauthLoginId,
    oauthMessage,
    oauthUrl,
    oauthPrompt,
    oauthInput,
    setOauthInput,
    providerSearch,
    setProviderSearch,
    savedSnapshot,
    setSavedSnapshot,
    saveMessage,
    setSaveMessage,
    currentSnapshot,
    dirty,
    query,
    connectedBuiltins,
    allAddableBuiltins,
    addableBuiltins,
    providerEntries,
    canDisconnect,
    beginOAuth,
    disconnectBuiltin
  } = controller;
  const renderBuiltinPanel = (provider: BuiltinProvider) => activeBuiltinId === provider.id ? <AppModal visible onClose={() => setActiveBuiltinId(null)} contentStyle={[providerPageStyles.modalPanel, {
    backgroundColor: colors.cardBg,
    borderColor: colors.borderColor
  }]}>
      <div className={"" + " " + ""}>
        <div className={""}>
          <ProviderMark name={provider.name} id={provider.id} colors={colors} />
          <div className={""}>
            <span className={"" + " " + ""}>{provider.name}</span>
            <span className={"" + " " + ""}>{oauthPrompt ? '完成浏览器授权' : '配置连接凭据'}</span>
          </div>
        </div>
        <button role="button" aria-label="关闭弹窗" onClick={() => setActiveBuiltinId(null)}>
          <X size={16} color={colors.textMuted} strokeWidth={1.8} />
        </button>
      </div>
      <div className={""}>
      {!provider.configured && provider.supports_oauth && (!provider.supports_api_key || builtinAuthMode === 'oauth') ? <button disabled={oauthProviderId === provider.id} onClick={() => void beginOAuth(provider.id)}>
          <LogIn size={15} color={colors.textSecondary} />
          <span className={"" + " " + ""}>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</span>
        </button> : null}
      {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <Field label={`${provider.name} API Key`} value={builtinKey} onChangeText={setBuiltinKey} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} /> : null}
      <div className={""}>
        {provider.configured && canDisconnect(provider) ? <button onClick={() => void disconnectBuiltin(provider.id)} role="button">
            <span className={"" + " " + ""}>断开连接</span>
          </button> : null}
        <button onClick={() => setActiveBuiltinId(null)} className={"" + " " + ""}><span className={"" + " " + ""}>取消</span></button>
        {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <button disabled={!builtinKey.trim() || savingBuiltinKey} onClick={() => {
          setSavingBuiltinKey(true);
          void saveApiKey(provider.id, builtinKey).then(() => {
            setBuiltinKey('');
            setActiveBuiltinId(null);
          }).finally(() => setSavingBuiltinKey(false));
        }} className={"" + " " + "" + " " + (!builtinKey.trim() || savingBuiltinKey ? "opacity-[0.45]" : "")}>
            <span className={"" + " " + ""}>{savingBuiltinKey ? '保存中…' : '保存 Key'}</span>
          </button> : null}
      </div>
      {oauthProviderId === provider.id && oauthMessage ? <span role="alert" className={"" + " " + ""}>{oauthMessage}</span> : null}
      {oauthProviderId === provider.id && oauthUrl ? <button onClick={() => void Linking.openURL(oauthUrl)} role="link"><span className={"" + " " + ""}>打开授权页</span></button> : null}
      {oauthProviderId === provider.id && oauthPrompt && oauthLoginId ? <div className={"gap-[6px]"}><span className={"" + " " + ""}>{oauthPrompt.message}</span><div className={"flex-row gap-[8px]"}><input value={oauthInput} onChangeText={setOauthInput} placeholder="粘贴授权码或回调 URL" placeholderTextColor={colors.textMuted} className={(isNative ? "" : "") + " " + "flex-1"} autoCapitalize="none" autoCorrect={false} /><button disabled={!oauthInput.trim()} onClick={() => void resolveOAuth(provider.id, oauthLoginId, oauthPrompt.id, oauthInput.trim()).then(() => setOauthInput(''))} className={"" + " " + "" + " " + (!oauthInput.trim() ? "opacity-[0.45]" : "")}><span className={"" + " " + ""}>提交</span></button></div></div> : null}
      {provider.configured && !canDisconnect(provider) ? <span className={"" + " " + ""}>
          由 {provider.auth_source} 配置；请从启动 AiJee 的环境中移除后重启运行时。
        </span> : null}
      </div>
    </AppModal> : null;
  const quickAuthActions = (provider: BuiltinProvider) => !provider.configured && (provider.supports_oauth || provider.supports_api_key) ? <div className={"flex-row gap-[2px]"}>
      {provider.supports_oauth ? <button role="button" aria-label={`${provider.name}账号登录`} onClick={() => {
      setBuiltinAuthMode('oauth');
      setBuiltinKey('');
      setActiveBuiltinId(null);
      void beginOAuth(provider.id);
    }}>
        <LogIn size={15} color={colors.textMuted} strokeWidth={1.8} />
      </button> : null}
      {provider.supports_api_key ? <button role="button" aria-label={`${provider.name}API Key`} onClick={() => {
      setBuiltinAuthMode('apiKey');
      setBuiltinKey('');
      setActiveBuiltinId(provider.id);
    }}>
        <KeyRound size={15} color={colors.textMuted} strokeWidth={1.8} />
      </button> : null}
    </div> : null;
  if (!loaded || !builtinsLoaded) {
    return <span className={"" + " " + ""}>正在加载模型服务…</span>;
  }
  if (parseError || builtinsError) {
    return <span role="alert" className={"" + " " + ""}>{parseError ? `无法读取 models.json：${parseError}` : builtinsError}</span>;
  }
  return <div className={""}>
      {headingVisible ? <div className={""}>
          <span className={"" + " " + ""}>模型服务</span>
          <span className={"" + " " + ""}>模型接入点、凭据与聊天模型列表</span>
        </div> : null}

      <input value={providerSearch} onChangeText={setProviderSearch} placeholder="搜索模型服务" placeholderTextColor={colors.placeholder} aria-label="搜索模型服务" className={"" + " " + ""} />

      <ModelSection title={`已连接 (${connectedBuiltins.length})`} colors={colors}>
        {connectedBuiltins.length ? connectedBuiltins.map((provider, index) => <div key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
              <ProviderRow name={provider.name} id={provider.id} connected meta={Number.isFinite(provider.model_count) ? `${provider.model_count} 个模型${provider.auth_source ? ` · ${provider.auth_source}` : ''}` : provider.auth_source} colors={colors} onClick={() => {
          setBuiltinKey('');
          setBuiltinAuthMode(provider.supports_oauth ? 'oauth' : 'apiKey');
          setActiveBuiltinId(id => id === provider.id ? null : provider.id);
        }} trailing={canDisconnect(provider) ? <button disabled={disconnectingBuiltinId === provider.id} onClick={event => {
          event.stopPropagation?.();
          void disconnectBuiltin(provider.id);
        }} role="button" aria-label={`断开 ${provider.name}`}>
                    <LogOut size={15} color={colors.textMuted} strokeWidth={1.8} />
                  </button> : null} />
            {renderBuiltinPanel(provider)}
          </div>) : <div className={""}><span className={"" + " " + ""}>尚未连接服务，从下方选择一个即可开始。</span></div>}
      </ModelSection>

      <ModelSection title="可添加" colors={colors}>
        {addableBuiltins.map((provider, index) => <div key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
            <ProviderRow name={provider.name} id={provider.id} colors={colors} trailing={quickAuthActions(provider)} />
            {renderBuiltinPanel(provider)}
          </div>)}
        {!query && allAddableBuiltins.length > 8 ? <>
            <RowDivider colors={colors} />
            <button onClick={() => setShowAllBuiltins(value => !value)} role="button">
              <span className={"" + " " + ""}>{showAllBuiltins ? '收起提供商' : `显示全部 ${allAddableBuiltins.length} 个提供商`}</span>
              {showAllBuiltins ? <ChevronUp size={14} color={colors.textMuted} strokeWidth={1.8} /> : <ChevronDown size={14} color={colors.textMuted} strokeWidth={1.8} />}
            </button>
          </> : null}
      </ModelSection>

      <ModelSection title="自定义服务" colors={colors}>
        {providerEntries.map(([name, provider], index) => <div key={name}>
            {index ? <RowDivider colors={colors} /> : null}
            <CustomProviderRow name={name} provider={provider} colors={colors} onUpdate={next => updateProvider(name, next)} onRemove={() => removeProvider(name)} />
          </div>)}
        {providerEntries.length ? <RowDivider colors={colors} /> : null}
        {adding ? <div className={""}><AddProviderForm colors={colors} onAdd={(name, baseUrl, api) => {
          void addProvider(name, {
            baseUrl: baseUrl || undefined,
            api,
            models: []
          });
          setAdding(false);
        }} onCancel={() => setAdding(false)} /></div> : <button onClick={() => setAdding(true)} role="button" aria-label="添加提供商">
            <Plus size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <span className={"" + " " + ""}>添加提供商</span>
          </button>}
      </ModelSection>

      {dirty ? <div className={"" + " " + ""}>
          <button disabled={saving} onClick={() => {
        setSaveMessage(null);
        void save(providers).then(() => {
          if (!useCustomModelsStore.getState().error) {
            setSavedSnapshot(currentSnapshot);
            setSaveMessage('已保存');
            setTimeout(() => setSaveMessage(null), 1800);
          }
        });
      }} role="button" aria-label="保存更改">
            <span className={"" + " " + ""}>{saving ? '保存中…' : '保存更改'}</span>
          </button>
        </div> : null}
      {saveMessage ? <span role="alert" className={"" + " " + ""}>{saveMessage}</span> : null}
      {error && !saving ? <span role="alert" className={"" + " " + ""}>{error}</span> : null}
    </div>;
}
