import type { ReactNode } from 'react';

import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NarrowNavigation } from './narrow-navigation';
import { WideNavigation } from './wide-navigation';
import { useAdaptiveNavigationController } from './use-adaptive-navigation-controller';

interface AdaptiveNavigationProps {
  children: ReactNode;
}

export function AdaptiveNavigation({ children }: AdaptiveNavigationProps) {
  const colors = useThemeTokens();
  const controller = useAdaptiveNavigationController();
  if (controller.isWideScreen) {
    return <WideNavigation colors={colors} controller={controller}>{children}</WideNavigation>;
  }
  return <NarrowNavigation colors={colors} controller={controller}>{children}</NarrowNavigation>;
}
