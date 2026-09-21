import { useState } from 'react';
import { useColors } from '../../hooks/use-custom-models-theme';
import { ApiTypeSelector } from './api-type-selector';
import { Field } from './field';

// ─── Add Provider Form ────────────────────────────────────────

export function AddProviderForm({
  colors,
  onAdd,
  onCancel
}: {
  colors: ReturnType<typeof useColors>;
  onAdd: (name: string, baseUrl: string, api: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [api, setApi] = useState('openai-completions');
  return <div className="flex flex-col gap-3 p-[var(--gutter)]">
      <span className="text-[var(--label-size)] font-medium text-foreground">新建提供商</span>
      <Field label="提供商名称" value={name} onChange={setName} placeholder="例如 ollama、lm-studio、my-vllm" colors={colors} autoFocus />
      <Field label="Base URL" value={baseUrl} onChange={setBaseUrl} placeholder="http://localhost:11434/v1" colors={colors} mono />
      <ApiTypeSelector value={api} onChange={setApi} colors={colors} />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="flex h-8 items-center rounded-md border border-border px-3 text-caption text-text-secondary hover:bg-hover">
          <span>取消</span>
        </button>
        <button onClick={() => {
        if (name.trim()) {
          onAdd(name.trim(), baseUrl.trim(), api);
        }
      }} disabled={!name.trim()} className="flex h-8 items-center rounded-md bg-accent px-3 text-caption font-medium text-accent-content hover:opacity-90 disabled:opacity-40">
          <span>添加提供商</span>
        </button>
      </div>
    </div>;
}
