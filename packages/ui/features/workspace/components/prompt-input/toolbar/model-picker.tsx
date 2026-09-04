import { Animated, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { ProviderIcon } from '@/components/provider-icons';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './types';

type ModelPickerProps = Pick<ToolbarController, 'theme' | 'inline' | 'isWideScreen' | 'onOpenMobileSheet' | 'currentModel' | 'toolbarDisabled' | 'controlHeight' | 'activeDropdown' | 'toggleDropdown' | 'toolbarDropdownAnim' | 'modelSearchRef' | 'modelScrollRef' | 'modelSearch' | 'setModelSearch' | 'setPopoverIndex' | 'popoverIndex' | 'handleSearchKeyPress' | 'providers' | 'hasModels' | 'flatModels' | 'handleSelectModel'>;

export function ModelPicker({ theme, inline, isWideScreen, onOpenMobileSheet, currentModel, toolbarDisabled, controlHeight, activeDropdown, toggleDropdown, toolbarDropdownAnim, modelSearchRef, modelScrollRef, modelSearch, setModelSearch, setPopoverIndex, popoverIndex, handleSearchKeyPress, providers, hasModels, flatModels, handleSelectModel }: ModelPickerProps) {
  return (
    <View style={styles.popoverAnchor}>
      <Pressable onPress={() => (isWideScreen ? toggleDropdown('model') : onOpenMobileSheet('model'))} disabled={toolbarDisabled} accessibilityRole="button" accessibilityLabel={`Model: ${currentModel?.name ?? 'Loading'}. Press to change.`} accessibilityState={{ expanded: activeDropdown === 'model', disabled: toolbarDisabled }} style={({ pressed }) => [styles.button, { height: controlHeight }, (pressed || toolbarDisabled) && { opacity: 0.7 }]}>
        <ProviderIcon provider={currentModel?.provider ?? ''} size={14} color={theme.textMuted} />
        <Text style={[styles.buttonText, { color: theme.textSecondary }]} numberOfLines={1}>{currentModel?.name ?? '…'}</Text>
        <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />
      </Pressable>
      {isWideScreen && activeDropdown === 'model' && (
        <Animated.View accessibilityRole="menu" accessibilityLabel="Model selection" style={[styles.popover, inline ? { left: undefined, right: 0 } : null, { backgroundColor: theme.dropdownBg, borderColor: theme.dropdownBorder, opacity: toolbarDropdownAnim, transform: [{ translateY: toolbarDropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }]}>
          <View style={[styles.searchWrap, { borderBottomColor: theme.dropdownBorder }]}>
            <TextInput ref={modelSearchRef} placeholder="Search models..." placeholderTextColor={theme.textMuted} style={[styles.searchInput, { color: theme.textPrimary }]} value={modelSearch} onChangeText={(value) => { setModelSearch(value); setPopoverIndex(0); }} onKeyPress={handleSearchKeyPress} accessibilityLabel="Search models" />
          </View>
          <ScrollView ref={modelScrollRef} style={styles.popoverScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {providers.length === 0 && <Text style={[styles.noResults, { color: theme.textMuted }]}>{hasModels ? 'No models found' : 'Loading models…'}</Text>}
            {providers.map((provider) => <View key={provider.name} accessibilityRole="none">
              <Text style={[styles.providerHeader, { color: theme.sectionColor }]} accessibilityRole="header">{provider.name}</Text>
              {provider.models.map((model) => {
                const flatIndex = flatModels.findIndex((item) => item.modelId === model.id && item.provider === model.provider);
                const highlighted = flatIndex === popoverIndex;
                const active = model.id === currentModel?.id;
                return <Pressable key={model.id} onPress={() => handleSelectModel(model.provider ?? 'unknown', model.id)} accessibilityRole="menuitem" accessibilityLabel={`${model.name ?? model.id} by ${model.provider ?? 'unknown'}`} accessibilityState={{ selected: active }} style={({ pressed, hovered }: any) => [styles.modelItem, highlighted && { backgroundColor: theme.selectedBg }, (pressed || hovered) && !highlighted && { backgroundColor: theme.hoverBg }]}>
                  <View style={styles.modelRow}><ProviderIcon provider={model.provider ?? 'unknown'} size={14} color={active ? theme.accentColor : theme.textMuted} /><Text style={[styles.modelName, { color: active ? theme.accentColor : theme.textPrimary }]}>{model.name}</Text></View>
                  {active && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                </Pressable>;
              })}
            </View>)}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}
