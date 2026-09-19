import { toTailwind } from "@/styles/to-tailwind";
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
      <div className={toTailwind([providerPageStyles.modalHeader, {
      borderBottomColor: colors.separator
    }])}>
        <div className={toTailwind(providerPageStyles.modalTitleGroup)}>
          <ProviderMark name={provider.name} id={provider.id} colors={colors} />
          <div className={toTailwind(providerPageStyles.modalTitleCopy)}>
            <span className={toTailwind([providerPageStyles.modalTitle, {
            color: colors.textPrimary
          }])}>{provider.name}</span>
            <span className={toTailwind([providerPageStyles.rowMeta, {
            color: colors.textMuted
          }])}>{oauthPrompt ? '完成浏览器授权' : '配置连接凭据'}</span>
          </div>
        </div>
        <button role="button" aria-label="关闭弹窗" onClick={() => setActiveBuiltinId(null)}>
          <X size={16} color={colors.textMuted} strokeWidth={1.8} />
        </button>
      </div>
      <div className={toTailwind(providerPageStyles.modalBody)}>
      {!provider.configured && provider.supports_oauth && (!provider.supports_api_key || builtinAuthMode === 'oauth') ? <button disabled={oauthProviderId === provider.id} onClick={() => void beginOAuth(provider.id)}>
          <LogIn size={15} color={colors.textSecondary} />
          <span className={toTailwind([providerPageStyles.linkText, {
          color: colors.textPrimary
        }])}>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</span>
        </button> : null}
      {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <Field label={`${provider.name} API Key`} value={builtinKey} onChangeText={setBuiltinKey} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} /> : null}
      <div className={toTailwind(providerPageStyles.panelActions)}>
        {provider.configured && canDisconnect(provider) ? <button onClick={() => void disconnectBuiltin(provider.id)} role="button">
            <span className={toTailwind([providerPageStyles.linkText, {
            color: colors.dangerColor
          }])}>断开连接</span>
          </button> : null}
        <button onClick={() => setActiveBuiltinId(null)} className={toTailwind([providerPageStyles.secondaryButton, {
          borderColor: colors.borderColor
        }])}><span className={toTailwind([providerPageStyles.linkText, {
            color: colors.textSecondary
          }])}>取消</span></button>
        {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <button disabled={!builtinKey.trim() || savingBuiltinKey} onClick={() => {
          setSavingBuiltinKey(true);
          void saveApiKey(provider.id, builtinKey).then(() => {
            setBuiltinKey('');
            setActiveBuiltinId(null);
          }).finally(() => setSavingBuiltinKey(false));
        }} className={toTailwind([providerPageStyles.primaryButton, {
          backgroundColor: colors.actionBg
        }, (!builtinKey.trim() || savingBuiltinKey) && {
          opacity: 0.45
        }])}>
            <span className={toTailwind([providerPageStyles.linkText, {
            color: colors.actionText
          }])}>{savingBuiltinKey ? '保存中…' : '保存 Key'}</span>
          </button> : null}
      </div>
      {oauthProviderId === provider.id && oauthMessage ? <span role="alert" className={toTailwind([providerPageStyles.rowMeta, {
        color: colors.textMuted
      }])}>{oauthMessage}</span> : null}
      {oauthProviderId === provider.id && oauthUrl ? <button onClick={() => void Linking.openURL(oauthUrl)} role="link"><span className={toTailwind([providerPageStyles.linkText, {
          color: colors.textPrimary
        }])}>打开授权页</span></button> : null}
      {oauthProviderId === provider.id && oauthPrompt && oauthLoginId ? <div className={toTailwind({
        gap: 6
      })}><span className={toTailwind([providerPageStyles.rowMeta, {
          color: colors.textMuted
        }])}>{oauthPrompt.message}</span><div className={toTailwind({
          flexDirection: 'row',
          gap: 8
        })}><input value={oauthInput} onChangeText={setOauthInput} placeholder="粘贴授权码或回调 URL" placeholderTextColor={colors.textMuted} className={toTailwind([isNative ? fieldNativeStyles.input : fieldWebStyles.input, {
            color: colors.textPrimary,
            borderColor: colors.borderColor,
            flex: 1
          }])} autoCapitalize="none" autoCorrect={false} /><button disabled={!oauthInput.trim()} onClick={() => void resolveOAuth(provider.id, oauthLoginId, oauthPrompt.id, oauthInput.trim()).then(() => setOauthInput(''))} className={toTailwind([providerPageStyles.secondaryButton, {
            borderColor: colors.borderColor
          }, !oauthInput.trim() && {
            opacity: 0.45
          }])}><span className={toTailwind([providerPageStyles.linkText, {
              color: colors.textSecondary
            }])}>提交</span></button></div></div> : null}
      {provider.configured && !canDisconnect(provider) ? <span className={toTailwind([providerPageStyles.rowMeta, {
        color: colors.textMuted
      }])}>
          由 {provider.auth_source} 配置；请从启动 AiJee 的环境中移除后重启运行时。
        </span> : null}
      </div>
    </AppModal> : null;
  const quickAuthActions = (provider: BuiltinProvider) => !provider.configured && (provider.supports_oauth || provider.supports_api_key) ? <div className={toTailwind({
    flexDirection: 'row',
    gap: 2
  })}>
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
    return <span className={toTailwind([providerPageStyles.message, {
      color: colors.textMuted
    }])}>正在加载模型服务…</span>;
  }
  if (parseError || builtinsError) {
    return <span role="alert" className={toTailwind([providerPageStyles.message, {
      color: colors.textPrimary
    }])}>{parseError ? `无法读取 models.json：${parseError}` : builtinsError}</span>;
  }
  return <div className={toTailwind(providerPageStyles.page)}>
      {headingVisible ? <div className={toTailwind(providerPageStyles.pageHeading)}>
          <span className={toTailwind([providerPageStyles.pageTitle, {
        color: colors.textPrimary
      }])}>模型服务</span>
          <span className={toTailwind([providerPageStyles.pageSubtitle, {
        color: colors.textMuted
      }])}>模型接入点、凭据与聊天模型列表</span>
        </div> : null}

      <input value={providerSearch} onChangeText={setProviderSearch} placeholder="搜索模型服务" placeholderTextColor={colors.placeholder} aria-label="搜索模型服务" className={toTailwind([providerPageStyles.search, {
      color: colors.textPrimary,
      backgroundColor: colors.inputBg,
      borderColor: colors.borderColor
    }])} />

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
          </div>) : <div className={toTailwind(providerPageStyles.emptyRow)}><span className={toTailwind([providerPageStyles.rowMeta, {
          color: colors.textMuted
        }])}>尚未连接服务，从下方选择一个即可开始。</span></div>}
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
              <span className={toTailwind([providerPageStyles.foldText, {
            color: colors.textSecondary
          }])}>{showAllBuiltins ? '收起提供商' : `显示全部 ${allAddableBuiltins.length} 个提供商`}</span>
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
        {adding ? <div className={toTailwind(providerPageStyles.inlinePanel)}><AddProviderForm colors={colors} onAdd={(name, baseUrl, api) => {
          void addProvider(name, {
            baseUrl: baseUrl || undefined,
            api,
            models: []
          });
          setAdding(false);
        }} onCancel={() => setAdding(false)} /></div> : <button onClick={() => setAdding(true)} role="button" aria-label="添加提供商">
            <Plus size={16} color={colors.textSecondary} strokeWidth={1.8} />
            <span className={toTailwind([providerPageStyles.rowName, {
          color: colors.textSecondary
        }])}>添加提供商</span>
          </button>}
      </ModelSection>

      {dirty ? <div className={toTailwind([providerPageStyles.saveBar, {
      backgroundColor: colors.cardBg,
      borderTopColor: colors.separator
    }])}>
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
            <span className={toTailwind([providerPageStyles.saveButtonText, {
          color: colors.actionText
        }])}>{saving ? '保存中…' : '保存更改'}</span>
          </button>
        </div> : null}
      {saveMessage ? <span role="alert" className={toTailwind([providerPageStyles.feedback, {
      color: colors.successColor
    }])}>{saveMessage}</span> : null}
      {error && !saving ? <span role="alert" className={toTailwind([providerPageStyles.feedback, {
      color: colors.dangerColor
    }])}>{error}</span> : null}
    </div>;
}
