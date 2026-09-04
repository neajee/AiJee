import { useMobileHeaderActionsController } from '../../hooks/use-mobile-header-actions-controller';
import { MobileHeaderActionsSheetView } from './view';
import type { MobileHeaderActionsSheetProps } from './types';

export function MobileHeaderActionsSheet(props: MobileHeaderActionsSheetProps) {
  const controller = useMobileHeaderActionsController(props);
  return <MobileHeaderActionsSheetView {...controller} />;
}

export type { MobileHeaderActionItem } from './types';
