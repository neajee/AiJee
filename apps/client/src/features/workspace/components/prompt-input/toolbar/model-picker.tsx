import { Animated } from "@/platform/animation";
import { Check, ChevronDown } from 'lucide-react';
import { ProviderIcon } from '@/components/provider-icons';
import { styles } from '../../../utils/toolbar-styles';
import type { ToolbarController } from './component-types';
type ModelPickerProps = Pick<ToolbarController, 'theme' | 'inline' | 'isWideScreen' | 'onOpenNarrowSheet' | 'currentModel' | 'toolbarDisabled' | 'controlHeight' | 'activeDropdown' | 'toggleDropdown' | 'toolbarDropdownAnim' | 'modelSearchRef' | 'modelScrollRef' | 'modelSearch' | 'setModelSearch' | 'setPopoverIndex' | 'popoverIndex' | 'handleSearchKeyPress' | 'providers' | 'hasModels' | 'flatModels' | 'handleSelectModel'>;
export function ModelPicker({
  theme,
  inline,
  isWideScreen,
  onOpenNarrowSheet,
  currentModel,
  toolbarDisabled,
  controlHeight,
  activeDropdown,
  toggleDropdown,
  toolbarDropdownAnim,
  modelSearchRef,
  modelScrollRef,
  modelSearch,
  setModelSearch,
  setPopoverIndex,
  popoverIndex,
  handleSearchKeyPress,
  providers,
  hasModels,
  flatModels,
  handleSelectModel
}: ModelPickerProps) {
  return <div className={""}>
      <button onClick={() => isWideScreen ? toggleDropdown('model') : onOpenNarrowSheet('model')} disabled={toolbarDisabled} role="button" aria-label={`Model: ${currentModel?.name ?? 'Loading'}. Press to change.`} accessibilityState={{
      expanded: activeDropdown === 'model',
      disabled: toolbarDisabled
    }}>
        <ProviderIcon provider={currentModel?.provider ?? ''} size={14} color={theme.textMuted} />
        <span className={"" + " " + ""}>{currentModel?.name ?? '…'}</span>
        <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />
      </button>
      {isWideScreen && activeDropdown === 'model' && <div role="menu" aria-label="Model selection" className={"" + " " + (inline ? "" : "") + " " + "opacity-[null]"}>
          <div className={"" + " " + ""}>
            <input ref={modelSearchRef} placeholder="Search models..." placeholderTextColor={theme.textMuted} className={"" + " " + ""} value={modelSearch} onChangeText={value => {
          setModelSearch(value);
          setPopoverIndex(0);
        }} onKeyPress={handleSearchKeyPress} aria-label="Search models" />
          </div>
          <div ref={modelScrollRef} className={""} keyboardShouldPersistTaps="handled">
            {providers.length === 0 && <span className={"" + " " + ""}>{hasModels ? 'No models found' : 'Loading models…'}</span>}
            {providers.map(provider => <div key={provider.name} role="none">
              <span className={"" + " " + ""} role="header">{provider.name}</span>
              {provider.models.map(model => {
            const flatIndex = flatModels.findIndex(item => item.modelId === model.id && item.provider === model.provider);
            const highlighted = flatIndex === popoverIndex;
            const active = model.id === currentModel?.id;
            return <button key={model.id} onClick={() => handleSelectModel(model.provider ?? 'unknown', model.id)} role="menuitem" aria-label={`${model.name ?? model.id} by ${model.provider ?? 'unknown'}`} accessibilityState={{
              selected: active
            }}>
                  <div className={""}><ProviderIcon provider={model.provider ?? 'unknown'} size={14} color={active ? theme.accentColor : theme.textMuted} /><span className={"" + " " + ""}>{model.name}</span></div>
                  {active && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                </button>;
          })}
            </div>)}
          </div>
        </div>}
    </div>;
}
