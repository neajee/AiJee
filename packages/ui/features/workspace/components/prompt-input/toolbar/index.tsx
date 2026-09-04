import { memo } from 'react';

import { ToolbarView } from './view';
import type { ToolbarProps } from './types';
import { useToolbarController } from '@/features/workspace/hooks/use-toolbar-controller';

function ToolbarComponent(props: ToolbarProps) {
  const controller = useToolbarController(props);
  return <ToolbarView {...controller} />;
}

export const Toolbar = memo(ToolbarComponent);

export type { ToolbarProps } from './types';
