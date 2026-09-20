import { useState } from 'react';
import { Plus } from 'lucide-react';
import { API_TYPES, ApiTypeSelector, Field, ModelEntryRow } from '../custom-models-form';
import { providerPageStyles } from '../../utils/custom-models-styles';
import { ProviderRow } from './provider-row';
import type { CustomProviderRowProps } from './component-types';
export function CustomProviderRow({
  name,
  provider,
  colors,
  onUpdate,
  onRemove
}: CustomProviderRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const modelCount = provider.models?.length ?? 0;
  const apiLabel = API_TYPES.find(item => item.value === provider.api)?.label ?? provider.api ?? '未设置 API';
  return <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => {
    setHovered(false);
    setMenuOpen(false);
  }}>
      <ProviderRow name={name} meta={`${apiLabel} · ${modelCount} 个模型`} colors={colors} onClick={() => setExpanded(value => !value)} trailing={hovered || menuOpen ? <div className={"block"}>
            <button onClick={event => {
        event.stopPropagation?.();
        setMenuOpen(value => !value);
      }} role="button" aria-label={`管理 ${name}`}>
              <span className={"  text-text-secondary"}>•••</span>
            </button>
            {menuOpen ? <button onClick={event => {
        event.stopPropagation?.();
        onRemove();
        setMenuOpen(false);
      }} role="button" aria-label={`删除 ${name}`} className={"  bg-card border-border"}>
                <span className={"  text-destructive"}>删除服务</span>
              </button> : null}
          </div> : null} />
      {expanded ? <div>
          <Field label="Base URL" value={provider.baseUrl ?? ''} onChange={event => (value => onUpdate({
        ...provider,
        baseUrl: value || undefined
      }))(event.target.value)} placeholder="http://localhost:11434/v1" colors={colors} mono />
          <ApiTypeSelector value={provider.api ?? 'openai-completions'} onChange={value => onUpdate({
        ...provider,
        api: value
      })} colors={colors} />
          <Field label="API 密钥" value={provider.apiKey ?? ''} onChange={event => (value => onUpdate({
        ...provider,
        apiKey: value || undefined
      }))(event.target.value)} placeholder="可选" colors={colors} />
          <div className={"block"}>
            <span className={"  text-text-secondary"}>模型</span>
            <button onClick={() => onUpdate({
          ...provider,
          models: [...(provider.models ?? []), {
            id: `model-${modelCount + 1}`
          }]
        })} role="button">
              <Plus size={14} color={colors.textSecondary} strokeWidth={2} />
              <span className={"  text-text-secondary"}>添加模型</span>
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
        </div> : null}
    </div>;
}
