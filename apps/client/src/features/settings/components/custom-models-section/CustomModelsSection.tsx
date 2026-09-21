import { useState } from "react";
import { Linking } from "@/platform/browser";
import { ChevronDown, ChevronUp, KeyRound, LogIn, LogOut, Plus, X } from "lucide-react";
import type { BuiltinProvider } from "@aijee/client-sdk";
import { useCustomModelsStore } from "../../store/custom-models";
import { useSettingsHeadingVisible } from "@/components/settings-surface";
import { AddProviderForm, Field } from "../custom-models-form";
import { ModelSection, ProviderMark, ProviderRow, RowDivider, CustomProviderRow, CustomProviderModal } from "../custom-models-provider-list";
import { useColors } from "../../hooks/use-custom-models-theme";
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
  const [editingName, setEditingName] = useState<string | null>(null);
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
  const editingEntry = providerEntries.find(([entryName]) => entryName === editingName);
  const renderBuiltinPanel = (provider: BuiltinProvider) => activeBuiltinId === provider.id ? <AppModal visible onClose={() => setActiveBuiltinId(null)} contentStyle={[{
    width: '100%',
    maxWidth: 520,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 12px 36px rgba(0,0,0,.28)'
  }, {
    backgroundColor: colors.cardBg,
    borderColor: colors.borderColor
  }]}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <ProviderMark name={provider.name} id={provider.id} colors={colors} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[var(--label-size)] text-foreground">{provider.name}</span>
              <span className="truncate text-[var(--desc-size)] text-text-secondary">{oauthPrompt ? '完成浏览器授权' : '配置连接凭据'}</span>
            </div>
          </div>
          <button role="button" aria-label="关闭弹窗" onClick={() => setActiveBuiltinId(null)} className="flex size-7 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-hover">
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {!provider.configured && provider.supports_oauth && (!provider.supports_api_key || builtinAuthMode === 'oauth') ? <button disabled={oauthProviderId === provider.id} onClick={() => void beginOAuth(provider.id)} className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-border text-caption font-medium text-text-secondary hover:bg-hover disabled:opacity-50">
              <LogIn size={15} strokeWidth={1.8} />
              <span>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</span>
            </button> : null}
          {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <Field label={`${provider.name} API Key`} value={builtinKey} onChange={value => setBuiltinKey(value)} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} mono /> : null}
          <div className="flex items-center justify-end gap-2">
            {provider.configured && canDisconnect(provider) ? <button onClick={() => void disconnectBuiltin(provider.id)} role="button" className="mr-auto flex h-8 items-center rounded-md px-2 text-caption text-destructive hover:bg-hover">
                <span>断开连接</span>
              </button> : null}
            <button onClick={() => setActiveBuiltinId(null)} className="flex h-8 items-center rounded-md border border-border px-3 text-caption text-text-secondary hover:bg-hover"><span>取消</span></button>
            {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <button disabled={!builtinKey.trim() || savingBuiltinKey} onClick={() => {
          setSavingBuiltinKey(true);
          void saveApiKey(provider.id, builtinKey).then(() => {
            setBuiltinKey('');
            setActiveBuiltinId(null);
          }).finally(() => setSavingBuiltinKey(false));
        }} className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40">
                <span>{savingBuiltinKey ? '保存中…' : '保存 Key'}</span>
              </button> : null}
          </div>
          {oauthProviderId === provider.id && oauthMessage ? <span role="alert" className="text-[var(--desc-size)] text-destructive">{oauthMessage}</span> : null}
          {oauthProviderId === provider.id && oauthUrl ? <button onClick={() => Linking.openURL(oauthUrl)} role="link" className="self-start text-caption text-accent hover:underline"><span>打开授权页</span></button> : null}
          {oauthProviderId === provider.id && oauthPrompt && oauthLoginId ? <div className="flex flex-col gap-1.5"><span className="text-[var(--desc-size)] text-text-secondary">{oauthPrompt.message}</span><div className="flex items-center gap-2"><input value={oauthInput} onChange={event => setOauthInput(event.target.value)} placeholder="粘贴授权码或回调 URL" className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-[var(--value-size)] text-foreground outline-none placeholder:text-text-tertiary" /><button disabled={!oauthInput.trim()} onClick={() => void resolveOAuth(provider.id, oauthLoginId, oauthPrompt.id, oauthInput.trim()).then(() => setOauthInput(''))} className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40"><span>提交</span></button></div></div> : null}
          {provider.configured && !canDisconnect(provider) ? <span className="text-meta text-text-tertiary">
              由 {provider.auth_source} 配置；请从启动 AiJee 的环境中移除后重启运行时。
            </span> : null}
        </div>
      </div>
    </AppModal> : null;
  const quickAuthActions = (provider: BuiltinProvider) => !provider.configured && (provider.supports_oauth || provider.supports_api_key) ? <div className="flex items-center gap-0.5">
      {provider.supports_oauth ? <button role="button" aria-label={`${provider.name}账号登录`} className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-hover" onClick={() => {
      setBuiltinAuthMode('oauth');
      setBuiltinKey('');
      setActiveBuiltinId(null);
      void beginOAuth(provider.id);
    }}>
        <LogIn size={15} strokeWidth={1.8} />
      </button> : null}
      {provider.supports_api_key ? <button role="button" aria-label={`${provider.name}API Key`} className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-hover" onClick={() => {
      setBuiltinAuthMode('apiKey');
      setBuiltinKey('');
      setActiveBuiltinId(provider.id);
    }}>
        <KeyRound size={15} strokeWidth={1.8} />
      </button> : null}
    </div> : null;
  if (!loaded || !builtinsLoaded) {
    return <div className="flex items-center gap-2 px-[var(--gutter)] py-4 text-[var(--desc-size)] text-text-tertiary">
        <span className="size-3 animate-spin rounded-full border-2 border-border border-t-text-tertiary" />
        正在加载模型服务…
      </div>;
  }
  if (parseError || builtinsError) {
    return <span role="alert" className="px-[var(--gutter)] text-[var(--desc-size)] text-destructive">{parseError ? `无法读取 models.json：${parseError}` : builtinsError}</span>;
  }
  return <div className="flex flex-col gap-[var(--group-gap)]">
      {headingVisible ? <div className="flex flex-col gap-0.5">
          <span className="text-[var(--title-size)] font-semibold text-foreground">模型服务</span>
          <span className="text-[var(--desc-size)] text-text-secondary">模型接入点、凭据与聊天模型列表</span>
        </div> : null}

      <input value={providerSearch} onChange={event => setProviderSearch(event.target.value)} placeholder="搜索模型服务" aria-label="搜索模型服务" className="h-8 w-full rounded-md border border-border bg-surface-raised px-2.5 text-[var(--value-size)] text-foreground outline-none placeholder:text-text-tertiary" />

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
        }} role="button" aria-label={`断开 ${provider.name}`} className="flex size-7 items-center justify-center rounded-md text-text-tertiary hover:bg-hover disabled:opacity-50">
                    <LogOut size={15} strokeWidth={1.8} />
                  </button> : null} />
            {renderBuiltinPanel(provider)}
          </div>) : <div className="flex min-h-[var(--row-min-height)] items-center px-[var(--gutter)] text-[var(--desc-size)] text-text-tertiary"><span>尚未连接服务，从下方选择一个即可开始。</span></div>}
      </ModelSection>

      <ModelSection title="可添加" colors={colors}>
        {addableBuiltins.map((provider, index) => <div key={provider.id}>
            {index ? <RowDivider colors={colors} /> : null}
            <ProviderRow name={provider.name} id={provider.id} colors={colors} trailing={quickAuthActions(provider)} />
            {renderBuiltinPanel(provider)}
          </div>)}
        {!query && allAddableBuiltins.length > 8 ? <>
            <RowDivider colors={colors} />
            <button onClick={() => setShowAllBuiltins(value => !value)} role="button" className="flex min-h-[var(--row-min-height)] w-full items-center justify-center gap-1.5 px-[var(--gutter)] text-caption text-text-secondary hover:bg-hover">
              <span>{showAllBuiltins ? '收起提供商' : `显示全部 ${allAddableBuiltins.length} 个提供商`}</span>
              {showAllBuiltins ? <ChevronUp size={14} strokeWidth={1.8} /> : <ChevronDown size={14} strokeWidth={1.8} />}
            </button>
          </> : null}
      </ModelSection>

      <ModelSection title="自定义服务" colors={colors}>
        {providerEntries.map(([name, provider], index) => <div key={name}>
            {index ? <RowDivider colors={colors} /> : null}
            <CustomProviderRow name={name} provider={provider} colors={colors} onEdit={() => setEditingName(name)} onRemove={() => removeProvider(name)} />
          </div>)}
        {providerEntries.length ? <RowDivider colors={colors} /> : null}
        <button onClick={() => setAdding(true)} role="button" aria-label="添加提供商" className="flex min-h-[var(--row-min-height)] w-full items-center justify-center gap-1.5 px-[var(--gutter)] text-caption text-text-secondary hover:bg-hover">
          <Plus size={16} strokeWidth={1.8} />
          <span>添加提供商</span>
        </button>
      </ModelSection>

      <AppModal visible={adding} title="新建提供商" showClose onClose={() => setAdding(false)}>
        <AddProviderForm colors={colors} onAdd={(name, baseUrl, api) => {
        void addProvider(name, {
          baseUrl: baseUrl || undefined,
          api,
          models: []
        });
        setAdding(false);
      }} onCancel={() => setAdding(false)} />
      </AppModal>
      {editingEntry ? <AppModal visible title={editingName ?? '自定义服务'} showClose onClose={() => setEditingName(null)}>
        <CustomProviderModal provider={editingEntry[1]} colors={colors} onUpdate={next => updateProvider(editingEntry[0], next)} onClose={() => setEditingName(null)} />
      </AppModal> : null}

      {dirty ? <div className="flex justify-end">
          <button disabled={saving} onClick={() => {
        setSaveMessage(null);
        void save(providers).then(() => {
          if (!useCustomModelsStore.getState().error) {
            setSavedSnapshot(currentSnapshot);
            setSaveMessage('已保存');
            setTimeout(() => setSaveMessage(null), 1800);
          }
        });
      }} role="button" aria-label="保存更改" className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40">
            <span>{saving ? '保存中…' : '保存更改'}</span>
          </button>
        </div> : null}
      {saveMessage ? <span role="alert" className="self-end text-[var(--desc-size)] text-success">{saveMessage}</span> : null}
      {error && !saving ? <span role="alert" className="self-end text-[var(--desc-size)] text-destructive">{error}</span> : null}
    </div>;
}
