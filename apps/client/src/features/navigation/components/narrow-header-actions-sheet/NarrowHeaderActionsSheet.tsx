import Animated from "@/platform/animation";
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
  } : {}} className={"" + " " + (true ? "" : "")}>
      <div className={"" + " " + "" + " " + ""}>
        <button className={""} onClick={onDismiss} />
      </div>

      <div className={"" + " " + "pb-[0]" + " " + ""}>
        <div>
          <div className={""}>
            <div className={"" + " " + ""} />
          </div>
        </div>

        <div className={""}>
          <span className={"" + " " + ""}>More</span>
          <span className={"" + " " + ""}>Quick actions for this screen</span>
        </div>

        <div className={""}>
          {items.map((item, index) => <button key={item.key} onClick={item.onPress} role="button" aria-label={item.label}>
              <div className={""}>{item.icon}</div>
              <span className={"" + " " + ""}>{item.label}</span>
            </button>)}
        </div>
      </div>
    </div>;
}
