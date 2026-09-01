import type { ComponentType } from 'react';
import {
  Bell,
  Cpu,
  Info,
  Layers,
  Palette,
  Wifi,
} from 'lucide-react-native';

import { AgentModesSection } from './components/agent-modes-section';
import { CustomModelsSection } from './components/custom-models-section';
import { ServersSection } from '../servers/components/servers-section';
import {
  AboutPanel,
  AboutRow,
  AppearancePanel,
  AppearanceRow,
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
    slug: 'servers',
    title: '连接',
    summary: '设备地址与授权连接',
    icon: Wifi,
    Component: ({ isDark }) => <ServersSection isDark={isDark} />,
  },
  {
    slug: 'models',
    title: '模型',
    summary: '模型接入点、凭据与聊天模型列表',
    icon: Cpu,
    Component: ({ isDark }) => <CustomModelsSection isDark={isDark} />,
  },
  {
    slug: 'modes',
    title: '个性化',
    summary: '为所有聊天设置自定义指令',
    icon: Layers,
    Component: ({ isDark }) => <AgentModesSection isDark={isDark} />,
  },
  {
    slug: 'notifications',
    title: '通知',
    summary: '推送提醒与音效',
    icon: Bell,
    Component: NotificationsPanel,
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
    summary: 'AiJee 版本与更新日志',
    icon: Info,
    Component: AboutPanel,
    Row: AboutRow,
  },
];

export function findSettingsSection(slug: string | undefined): SettingsSection | undefined {
  if (!slug) return undefined;
  return SETTINGS_SECTIONS.find((s) => s.slug === slug);
}
