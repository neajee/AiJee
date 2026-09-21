import { Plus } from 'lucide-react';
import { ApiTypeSelector, Field, ModelEntryRow } from '../custom-models-form';
import type { CustomProviderModalProps } from './component-types';
/** Editor for one custom provider, shown in a modal instead of inline. */
export function CustomProviderModal({
  provider,
  colors,
  onUpdate,
  onClose
}: CustomProviderModalProps) {
  const modelCount = provider.models?.length ?? 0;
  return <div className="flex flex-col gap-4">
      <Field label="Base URL" value={provider.baseUrl ?? ''} onChange={value => onUpdate({
      ...provider,
      baseUrl: value || undefined
    })} placeholder="http://localhost:11434/v1" colors={colors} mono />
      <ApiTypeSelector value={provider.api ?? 'openai-completions'} onChange={value => onUpdate({
      ...provider,
      api: value
    })} colors={colors} />
      <Field label="API 密钥" value={provider.apiKey ?? ''} onChange={value => onUpdate({
      ...provider,
      apiKey: value || undefined
    })} placeholder="可选" colors={colors} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[var(--desc-size)] text-text-secondary">模型</span>
        <button onClick={() => onUpdate({
        ...provider,
        models: [...(provider.models ?? []), {
          id: `model-${modelCount + 1}`
        }]
      })} role="button" className="flex h-7 items-center gap-1 self-start rounded-md border border-border px-2 text-caption text-text-secondary hover:bg-hover">
          <Plus size={14} color={colors.textSecondary} strokeWidth={2} />
          <span>添加模型</span>
        </button>
      </div>
      {(provider.models ?? []).map((model, index) => <ModelEntryRow key={`${model.id}-${index}`} model={model} colors={colors} isLast={index === modelCount - 1} onUpdate={next => {
      const models = [...(provider.models ?? [])];
      models[index] = next;
      onUpdate({
        ...provider,
        models
      });
    }} onRemove={() => onUpdate({
      ...provider,
      models: (provider.models ?? []).filter((_, itemIndex) => itemIndex !== index)
    })} />)}
      <div className="flex justify-end">
        <button onClick={onClose} className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90">
          <span>完成</span>
        </button>
      </div>
    </div>;
}
