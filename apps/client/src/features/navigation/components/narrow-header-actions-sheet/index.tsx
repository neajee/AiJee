import { useNarrowHeaderActionsController } from '../../hooks/use-narrow-header-actions-controller';
import { NarrowHeaderActionsSheetView } from './view';
import type { NarrowHeaderActionsSheetProps } from './types';

export function NarrowHeaderActionsSheet(props: NarrowHeaderActionsSheetProps) {
  const controller = useNarrowHeaderActionsController(props);
  return <NarrowHeaderActionsSheetView {...controller} />;
}

export type { NarrowHeaderActionItem } from './types';
