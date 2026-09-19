import { useNarrowHeaderActionsController } from '../../hooks/use-narrow-header-actions-controller';
import { NarrowHeaderActionsSheetView } from './NarrowHeaderActionsSheet';
import type { NarrowHeaderActionsSheetProps } from './component-types';

export function NarrowHeaderActionsSheet(props: NarrowHeaderActionsSheetProps) {
  const controller = useNarrowHeaderActionsController(props);
  return <NarrowHeaderActionsSheetView {...controller} />;
}

export type { NarrowHeaderActionItem } from './component-types';
