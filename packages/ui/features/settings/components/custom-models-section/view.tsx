import { Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import { ChevronDown, ChevronUp, KeyRound, LogIn, LogOut, Plus, X } from "lucide-react-native";
import type { BuiltinProvider } from "@aijee/client-sdk";
import { useCustomModelsStore } from "../../store/custom-models";
import { useSettingsHeadingVisible } from "@/components/settings-surface";
import { AddProviderForm, Field } from "../custom-models-form";
import { ModelSection, ProviderMark, ProviderRow, RowDivider, CustomProviderRow } from "../custom-models-provider-list";
import { useColors } from "../../hooks/use-custom-models-theme";
import { fieldNativeStyles, fieldWebStyles, providerPageStyles } from "../../utils/custom-models-styles";
import { AppModal } from "@/components/ui";
import type { CustomModelsController } from "../../hooks/use-custom-models-controller";

export function CustomModelsView({ controller, isDark, isNative }: { controller: CustomModelsController; isDark: boolean; isNative?: boolean }) {
  const colors = useColors(isDark, isNative);
  const headingVisible = useSettingsHeadingVisible();
  const {
    providers, loaded, saving, error, parseError, save, addProvider, removeProvider, updateProvider,
    builtinProviders, builtinsLoaded, builtinsError, saveApiKey, resolveOAuth,
    adding, setAdding, showAllBuiltins, setShowAllBuiltins, activeBuiltinId, setActiveBuiltinId,
    builtinAuthMode, setBuiltinAuthMode, builtinKey, setBuiltinKey, savingBuiltinKey, setSavingBuiltinKey,
    disconnectingBuiltinId, oauthProviderId, oauthLoginId, oauthMessage, oauthUrl, oauthPrompt, oauthInput, setOauthInput,
    providerSearch, setProviderSearch, savedSnapshot, setSavedSnapshot, saveMessage, setSaveMessage, currentSnapshot, dirty, query, connectedBuiltins, allAddableBuiltins, addableBuiltins, providerEntries, canDisconnect, beginOAuth, disconnectBuiltin,
  } = controller;
  const renderBuiltinPanel = (provider: BuiltinProvider) => activeBuiltinId === provider.id ? (
    <AppModal visible onClose={() => setActiveBuiltinId(null)} contentStyle={[providerPageStyles.modalPanel, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
      <View style={[providerPageStyles.modalHeader, { borderBottomColor: colors.separator }]}>
        <View style={providerPageStyles.modalTitleGroup}>
          <ProviderMark name={provider.name} id={provider.id} colors={colors} />
          <View style={providerPageStyles.modalTitleCopy}>
            <Text style={[providerPageStyles.modalTitle, { color: colors.textPrimary }]}>{provider.name}</Text>
            <Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{oauthPrompt ? '完成浏览器授权' : '配置连接凭据'}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="关闭弹窗" onPress={() => setActiveBuiltinId(null)} style={({ pressed }) => [providerPageStyles.modalClose, pressed && { backgroundColor: colors.pressedBg }]}>
          <X size={16} color={colors.textMuted} strokeWidth={1.8} />
        </Pressable>
      </View>
      <View style={providerPageStyles.modalBody}>
      {!provider.configured && provider.supports_oauth && (!provider.supports_api_key || builtinAuthMode === 'oauth') ? (
        <Pressable disabled={oauthProviderId === provider.id} onPress={() => void beginOAuth(provider.id)} style={({ pressed }) => [providerPageStyles.secondaryButton, { borderColor: colors.borderColor }, pressed && { backgroundColor: colors.pressedBg }]}>
          <LogIn size={15} color={colors.textSecondary} />
          <Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>{oauthProviderId === provider.id ? '正在登录…' : '使用账号登录'}</Text>
        </Pressable>
      ) : null}
      {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? <Field label={`${provider.name} API Key`} value={builtinKey} onChangeText={setBuiltinKey} placeholder={provider.configured ? '输入新 Key 可替换当前凭据' : '粘贴 API Key'} colors={colors} /> : null}
      <View style={providerPageStyles.panelActions}>
        {provider.configured && canDisconnect(provider) ? (
          <Pressable onPress={() => void disconnectBuiltin(provider.id)} style={({ pressed }) => [providerPageStyles.textButton, pressed && { opacity: 0.6 }]} accessibilityRole="button">
            <Text style={[providerPageStyles.linkText, { color: colors.dangerColor }]}>断开连接</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => setActiveBuiltinId(null)} style={[providerPageStyles.secondaryButton, { borderColor: colors.borderColor }]}><Text style={[providerPageStyles.linkText, { color: colors.textSecondary }]}>取消</Text></Pressable>
        {provider.supports_api_key && (provider.configured || !provider.supports_oauth || builtinAuthMode === 'apiKey') ? (
          <Pressable disabled={!builtinKey.trim() || savingBuiltinKey} onPress={() => { setSavingBuiltinKey(true); void saveApiKey(provider.id, builtinKey).then(() => { setBuiltinKey(''); setActiveBuiltinId(null); }).finally(() => setSavingBuiltinKey(false)); }} style={[providerPageStyles.primaryButton, { backgroundColor: colors.actionBg }, (!builtinKey.trim() || savingBuiltinKey) && { opacity: 0.45 }]}>
            <Text style={[providerPageStyles.linkText, { color: colors.actionText }]}>{savingBuiltinKey ? '保存中…' : '保存 Key'}</Text>
          </Pressable>
        ) : null}
      </View>
      {oauthProviderId === provider.id && oauthMessage ? <Text accessibilityRole="alert" style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{oauthMessage}</Text> : null}
      {oauthProviderId === provider.id && oauthUrl ? <Pressable onPress={() => void Linking.openURL(oauthUrl)} accessibilityRole="link"><Text style={[providerPageStyles.linkText, { color: colors.textPrimary }]}>打开授权页</Text></Pressable> : null}
      {oauthProviderId === provider.id && oauthPrompt && oauthLoginId ? <View style={{ gap: 6 }}><Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>{oauthPrompt.message}</Text><View style={{ flexDirection: 'row', gap: 8 }}><TextInput value={oauthInput} onChangeText={setOauthInput} placeholder="粘贴授权码或回调 URL" placeholderTextColor={colors.textMuted} style={[isNative ? fieldNativeStyles.input : fieldWebStyles.input, { color: colors.textPrimary, borderColor: colors.borderColor, flex: 1 }]} autoCapitalize="none" autoCorrect={false} /><Pressable disabled={!oauthInput.trim()} onPress={() => void resolveOAuth(provider.id, oauthLoginId, oauthPrompt.id, oauthInput.trim()).then(() => setOauthInput(''))} style={[providerPageStyles.secondaryButton, { borderColor: colors.borderColor }, !oauthInput.trim() && { opacity: 0.45 }]}><Text style={[providerPageStyles.linkText, { color: colors.textSecondary }]}>提交</Text></Pressable></View></View> : null}
      {provider.configured && !canDisconnect(provider) ? (
        <Text style={[providerPageStyles.rowMeta, { color: colors.textMuted }]}>
          由 {provider.auth_source} 配置；请从启动 AiJee 的环境中移除后重启运行时。
        </Text>
      ) : null}
      </View>
    </AppModal>
  ) : null;

  const quickAuthActions = (provider: BuiltinProvider) => !provider.configured && (provider.supports_oauth || provider.supports_api_key) ? (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {provider.supports_oauth ? <Pressable accessibilityRole="button" accessibilityLabel={`${provider.name}账号登录`} onPress={() => { setBuiltinAuthMode('oauth'); setBuiltinKey(''); setActiveBuiltinId(null); void beginOAuth(provider.id); }} style={({ pressed }) => [providerPageStyles.iconAction, pressed && { backgroundColor: colors.pressedBg }]}>
        <LogIn size={15} color={colors.textMuted} strokeWidth={1.8} />
      </Pressable> : null}
      {provider.supports_api_key ? <Pressable accessibilityRole="button" accessibilityLabel={`${provider.name}API Key`} onPress={() => { setBuiltinAuthMode('apiKey'); setBuiltinKey(''); setActiveBuiltinId(provider.id); }} style={({ pressed }) => [providerPageStyles.iconAction, pressed && { backgroundColor: colors.pressedBg }]}>
        <KeyRound size={15} color={colors.textMuted} strokeWidth={1.8} />
      </Pressable> : null}
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
                onPress={() => { setBuiltinKey(''); setBuiltinAuthMode(provider.supports_oauth ? 'oauth' : 'apiKey'); setActiveBuiltinId((id) => id === provider.id ? null : provider.id); }}
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
            <ProviderRow name={provider.name} id={provider.id} colors={colors} trailing={quickAuthActions(provider)} />
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
