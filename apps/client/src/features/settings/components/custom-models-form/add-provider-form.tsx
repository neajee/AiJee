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
  return <div className={"  bg-card"}>
      <div className="flex flex-col">
        <span className={"  text-foreground"}>
          新建提供商
        </span>
        <Field label="提供商名称" value={name} onChange={event => setName(event.target.value)} placeholder="例如 ollama、lm-studio、my-vllm" colors={colors} autoFocus />
        <Field label="Base URL" value={baseUrl} onChange={event => setBaseUrl(event.target.value)} placeholder="http://localhost:11434/v1" colors={colors} mono />
        <ApiTypeSelector value={api} onChange={setApi} colors={colors} />
        <div className="flex flex-col">
          <button onClick={onCancel}>
            <span className={"  text-text-secondary"}>
              取消
            </span>
          </button>
          <button onClick={() => {
          if (name.trim()) {
            onAdd(name.trim(), baseUrl.trim(), api);
          }
        }}>
            <span>
              添加提供商
            </span>
          </button>
        </div>
      </div>
    </div>;
}
