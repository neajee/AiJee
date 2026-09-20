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
  return <div className="relative min-w-0">
      <button className="flex h-7 min-w-0 items-center gap-1.5 rounded-md px-2 text-xs text-text-secondary hover:bg-hover disabled:opacity-40" onClick={() => isWideScreen ? toggleDropdown('model') : onOpenNarrowSheet('model')} disabled={toolbarDisabled} role="button" aria-label={`Model: ${currentModel?.name ?? 'Loading'}. Press to change.`}>
        <ProviderIcon provider={currentModel?.provider ?? ''} size={14} color={theme.textMuted} />
        <span className="min-w-0 flex-1 truncate">{currentModel?.name ?? '…'}</span>
        <ChevronDown className="shrink-0" size={14} color={theme.textMuted} strokeWidth={1.8} />
      </button>
      {isWideScreen && activeDropdown === 'model' && <div role="menu" aria-label="Model selection" className="absolute bottom-full left-0 z-50 mb-1 max-h-72 w-60 overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-xl">
          <div className="sticky top-0 z-10 mb-1 bg-card pb-1">
            <input ref={modelSearchRef} placeholder="Search models..." className="h-7 w-full rounded border border-border bg-muted px-2 text-xs text-foreground outline-none placeholder:text-text-secondary focus:border-primary" value={modelSearch} onChange={event => (value => {
          setModelSearch(value);
          setPopoverIndex(0);
        })(event.target.value)} onKeyPress={handleSearchKeyPress} aria-label="Search models" />
          </div>
          <div ref={modelScrollRef} className="flex flex-col gap-2">
            {providers.length === 0 && <span className="px-2 py-3 text-xs text-text-secondary">{hasModels ? 'No models found' : 'Loading models…'}</span>}
            {providers.map(provider => <div key={provider.name} role="none" className="flex flex-col gap-0.5">
              <span className="px-2 pt-1 text-[10px] font-medium uppercase tracking-wide text-text-secondary" role="header">{provider.name}</span>
              {provider.models.map(model => {
            const flatIndex = flatModels.findIndex(item => item.modelId === model.id && item.provider === model.provider);
            const highlighted = flatIndex === popoverIndex;
            const active = model.id === currentModel?.id;
            return <button className={`flex min-h-7 w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-hover ${active ? 'bg-accent' : ''} ${highlighted ? 'ring-1 ring-primary' : ''}`} key={model.id} onClick={() => handleSelectModel(model.provider ?? 'unknown', model.id)} role="menuitem" aria-label={`${model.name ?? model.id} by ${model.provider ?? 'unknown'}`}>
                  <ProviderIcon provider={model.provider ?? 'unknown'} size={14} color={active ? theme.accentColor : theme.textMuted} /><span className="min-w-0 flex-1 truncate">{model.name ?? model.id}</span>
                  {active && <Check size={14} color={theme.accentColor} strokeWidth={2} />}
                </button>;
          })}
            </div>)}
          </div>
        </div>}
    </div>;
}
