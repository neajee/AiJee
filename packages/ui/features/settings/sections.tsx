import type { ComponentType } from 'react';
import {
  Bell,
  Cpu,
  Info,
  Layers,
  Mic,
  Palette,
  Trash2,
} from 'lucide-react-native';

import { AgentModesSection } from './components/agent-modes-section';
import { CustomModelsSection } from './components/custom-models-section';
import { SpeechSettings } from '../speech/components/speech-settings';
import {
  AboutPanel,
  AboutRow,
  AppearancePanel,
  AppearanceRow,
  DataPanel,
  NotificationsPanel,
} from './panels';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface SettingsSection {
  /** URL segment: /settings/<slug> */
  slug: string;
  /** Row label on the index list, and title on the detail screen. */
  title: string;
  /** One-line summary shown under the row label on the index list. */
  summary: string;
  icon: IconType;
  /** Renders the section body. Owns its own data loading so deep links work. */
  Component: ComponentType<{ isDark: boolean }>;
  /**
   * Optional self-contained index row. When present the topic resolves inline
   * on the list — no chevron, no screen push — because the whole topic is one
   * control or one piece of status.
   */
  Row?: ComponentType<{ isLast?: boolean }>;
}

/**
 * Single source of truth for the settings topics.
 *
 * The index screen maps over this to build either a drill-down list (narrow
 * viewports) or the stacked long page (wide viewports), and the `[section]`
 * route resolves a slug against it. Adding a topic means adding one entry.
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    slug: 'modes',
    title: 'Agent 模式',
    summary: '预设的系统提示与工具组合',
    icon: Layers,
    Component: ({ isDark }) => <AgentModesSection isDark={isDark} />,
  },
  {
    slug: 'models',
    title: '自定义模型',
    summary: 'Ollama、LM Studio、vLLM 等兼容提供商',
    icon: Cpu,
    Component: ({ isDark }) => <CustomModelsSection isDark={isDark} />,
  },
  {
    slug: 'speech',
    title: '语音识别',
    summary: '内置语音或 Whisper 兼容服务',
    icon: Mic,
    Component: () => <SpeechSettings />,
  },
  {
    slug: 'notifications',
    title: '通知',
    summary: '推送提醒与音效',
    icon: Bell,
    Component: NotificationsPanel,
  },
  {
    slug: 'data',
    title: '数据',
    summary: '清除本机缓存与偏好',
    icon: Trash2,
    Component: DataPanel,
  },
  {
    slug: 'appearance',
    title: '外观',
    summary: '浅色、深色或跟随系统',
    icon: Palette,
    Component: AppearancePanel,
    Row: AppearanceRow,
  },
  {
    slug: 'about',
    title: '关于',
    summary: 'Pi Agent 版本、更新与服务器信息',
    icon: Info,
    Component: AboutPanel,
    Row: AboutRow,
  },
];

export function findSettingsSection(slug: string | undefined): SettingsSection | undefined {
  if (!slug) return undefined;
  return SETTINGS_SECTIONS.find((s) => s.slug === slug);
}
