import { AppSheet } from '@/components/ui';
import type { NarrowHeaderActionsSheetViewProps } from './component-types';
export function NarrowHeaderActionsSheetView({
  visible,
  items,
  bottomInset,
  isDark,
  textPrimary,
  textSecondary,
  rowBorder,
  overlayColor,
  handleColor,
  sheetStyle,
  overlayStyle,
  panGesture,
  onDismiss
}: NarrowHeaderActionsSheetViewProps) {
  return <AppSheet visible={visible} onClose={onDismiss} title="More">
    <p className="mb-3 text-body text-muted-foreground">Quick actions for this screen</p>
    <div className="flex flex-col gap-1">{items.map(item => <button key={item.key} className="flex items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-hover" onClick={() => { item.onClick(); onDismiss(); }} aria-label={item.label}>
      <span className="flex size-5 items-center justify-center">{item.icon}</span><span>{item.label}</span>
    </button>)}</div>
  </AppSheet>;
}
