export function legacyBrand(name: string, id = ''): 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | null {
  const value = `${id} ${name}`.toLowerCase();
  if (value.includes('anthropic') || value.includes('claude')) return 'Anthropic';
  if (value.includes('openai') || value.includes('chatgpt')) return 'OpenAI';
  if (value.includes('google') || value.includes('gemini')) return 'Google';
  if (value.includes('meta') || value.includes('llama')) return 'Meta';
  return null;
}

export function lobeProviderKey(name: string, id = ''): string | null {
  const value = `${id} ${name}`.toLowerCase();
  const aliases: Array<[string, string]> = [
    ['vertex', 'vertex-ai'], ['github-copilot', 'copilot'], ['copilot', 'copilot'],
    ['openrouter', 'openrouter'], ['kimi', 'kimi'], ['moonshot', 'moonshot'],
    ['radius', 'radius'], ['xai', 'xai'], ['google', 'google'], ['gemini', 'gemini'],
    ['amazon bedrock', 'bedrock'], ['bedrock', 'bedrock'], ['baseten', 'baseten'],
    ['cerebras', 'cerebras'], ['cloudflare', 'cloudflare'], ['fireworks', 'fireworks'],
    ['github', 'github'], ['groq', 'groq'], ['huggingface', 'huggingface'],
    ['together', 'together'], ['zai', 'zai'], ['qwen', 'qwen'],
    ['anthropic', 'anthropic'], ['claude', 'claude'], ['openai-codex', 'codex'],
    ['openai', 'openai'], ['deepseek', 'deepseek'], ['mistral', 'mistral'],
  ];
  return aliases.find(([alias]) => value.includes(alias))?.[1] ?? null;
}
