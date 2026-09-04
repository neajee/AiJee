import { PI_MODEL_DEFAULTS } from '@aijee/client-sdk';

export const API_TYPES = [
  { value: 'openai-completions', label: 'OpenAI 对话' },
  { value: 'openai-responses', label: 'OpenAI 响应' },
  { value: 'anthropic-messages', label: 'Anthropic' },
  { value: 'google-generativeai', label: 'Google AI' },
];

export const PI_DEFAULTS = PI_MODEL_DEFAULTS;
