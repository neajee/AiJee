import { toTailwind } from "@/styles/to-tailwind";
import Animated from "@/platform/animation";
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';
import { styles } from './style-tokens';
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
  } : {}} className={toTailwind([styles.root, true && {
    pointerEvents: visible ? 'auto' : 'none'
  } as any])}>
      <div className={toTailwind([styles.overlay, {
      backgroundColor: overlayColor
    }, overlayStyle])}>
        <button className={toTailwind(ABSOLUTE_FILL_STYLE)} onClick={onDismiss} />
      </div>

      <div className={toTailwind([styles.sheet, {
      backgroundColor: isDark ? '#1e1e1e' : '#FFFFFF',
      paddingBottom: bottomInset + 12
    }, sheetStyle])}>
        <div>
          <div className={toTailwind(styles.handleBar)}>
            <div className={toTailwind([styles.handle, {
            backgroundColor: handleColor
          }])} />
          </div>
        </div>

        <div className={toTailwind(styles.header)}>
          <span className={toTailwind([styles.title, {
          color: textPrimary
        }])}>More</span>
          <span className={toTailwind([styles.subtitle, {
          color: textSecondary
        }])}>Quick actions for this screen</span>
        </div>

        <div className={toTailwind(styles.list)}>
          {items.map((item, index) => <button key={item.key} onClick={item.onPress} role="button" aria-label={item.label}>
              <div className={toTailwind(styles.rowIcon)}>{item.icon}</div>
              <span className={toTailwind([styles.rowLabel, {
            color: textPrimary
          }])}>{item.label}</span>
            </button>)}
        </div>
      </div>
    </div>;
}
