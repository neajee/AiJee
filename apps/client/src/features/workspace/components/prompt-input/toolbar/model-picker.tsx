import { Animated } from "@/styles/motion";
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
  return <div className={"block"}>
      <button onClick={() => isWideScreen ? toggleDropdown('model') : onOpenNarrowSheet('model')} disabled={toolbarDisabled} role="button" aria-label={`Model: ${currentModel?.name ?? 'Loading'}. Press to change.`}>
        <ProviderIcon provider={currentModel?.provider ?? ''} size={14} color={theme.textMuted} />
        <span className={"  text-text-secondary"}>{currentModel?.name ?? '…'}</span>
        <ChevronDown size={14} color={theme.textMuted} strokeWidth={1.8} />
      </button>
      {isWideScreen && activeDropdown === 'model' && <div role="menu" aria-label="Model selection" className={"  bg-surface border-border opacity-100"}>
          <div>
            <input ref={modelSearchRef} placeholder="Search models..." className={"  text-foreground"} value={modelSearch} onChange={event => (value => {
          setModelSearch(value);
          setPopoverIndex(0);
        })(event.target.value)} onKeyPress={handleSearchKeyPress} aria-label="Search models" />
          </div>
          <div ref={modelScrollRef} className={"block"} keyboardShouldPersistTaps="handled">
            {providers.length === 0 && <span className={"  text-text-secondary"}>{hasModels ? 'No models found' : 'Loading models…'}</span>}
            {providers.map(provider => <div key={provider.name} role="none">
              <span className={"  text-foreground"} role="header">{provider.name}</span>
              {provider.models.map(model => {
            const flatIndex = flatModels.findIndex(item => item.modelId === model.id && item.provider === model.provider);
            const highlighted = flatIndex === popoverIndex;
            const active = model.id === currentModel?.id;
            return <button key={model.id} onClick={() => handleSelectModel(model.provider ?? 'unknown', model.id)} role="menuitem" aria-label={`${model.name ?? model.id} by ${model.provider ?? 'unknown'}`}>
                  <div className={"block"}><ProviderIcon provider={model.provider ?? 'unknown'} size={14} color={active ? theme.accentColor : theme.textMuted} /><span>{model.name}</span></div>
                  {active && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                </button>;
          })}
            </div>)}
          </div>
        </div>}
    </div>;
}
