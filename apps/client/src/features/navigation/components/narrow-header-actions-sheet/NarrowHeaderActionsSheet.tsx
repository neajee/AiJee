import Animated from "@/styles/motion";
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
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
  return <div {...false ? {
    pointerEvents: visible ? 'auto' : 'none'
  } : {}}>
      <div>
        <button className={"block"} onClick={onDismiss} />
      </div>

      <div className={"  pb-0"}>
        <div>
          <div className={"block"}>
            <div />
          </div>
        </div>

        <div className={"block"}>
          <span>More</span>
          <span>Quick actions for this screen</span>
        </div>

        <div className={"block"}>
          {items.map((item, index) => <button key={item.key} onClick={item.onPress} role="button" aria-label={item.label}>
              <div className={"block"}>{item.icon}</div>
              <span>{item.label}</span>
            </button>)}
        </div>
      </div>
    </div>;
}
