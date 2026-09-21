import { useState } from 'react';
import { API_TYPES } from '../custom-models-form';
import { ProviderRow } from './provider-row';
import type { CustomProviderRowProps } from './component-types';
export function CustomProviderRow({
  name,
  provider,
  colors,
  onEdit,
  onRemove
}: CustomProviderRowProps) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const modelCount = provider.models?.length ?? 0;
  const apiLabel = API_TYPES.find(item => item.value === provider.api)?.label ?? provider.api ?? '未设置 API';
  return <div onPointerEnter={() => setHovered(true)} onPointerLeave={() => {
    setHovered(false);
    setMenuOpen(false);
  }}>
      <ProviderRow name={name} meta={`${apiLabel} · ${modelCount} 个模型`} colors={colors} onClick={onEdit} trailing={hovered || menuOpen ? <div className="relative flex items-center">
            <button onClick={event => {
        event.stopPropagation?.();
        setMenuOpen(value => !value);
      }} role="button" aria-label={`管理 ${name}`} className="flex size-7 items-center justify-center rounded-md text-text-secondary hover:bg-hover">
              <span className="text-caption leading-none">•••</span>
            </button>
            {menuOpen ? <button onClick={event => {
        event.stopPropagation?.();
        onRemove();
        setMenuOpen(false);
      }} role="button" aria-label={`删除 ${name}`} className="absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-caption text-destructive shadow-lg">
                <span>删除服务</span>
              </button> : null}
          </div> : null} />
    </div>;
}
