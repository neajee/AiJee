export const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'Extension', label: '扩展' },
  { value: 'Skill', label: '技能' },
  { value: 'Prompt', label: '提示词' },
  { value: 'Theme', label: '主题' },
];

export const SEARCH_DEBOUNCE_MS = 350;
export const CARD_MIN_WIDTH = 340;
export type MarketplaceTab = 'discover' | 'installed';
