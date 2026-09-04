import { ABSOLUTE_FILL_STYLE } from "@/constants/layout";
import { SEAM_TOGGLE_HEIGHT, SEAM_TOGGLE_WIDTH } from '@/components/ui/seam-toggle';

export const HOVER_ZONE_WIDTH = 12;

export const styles = {
  wideContainer: { flex: 1 },
  bodyRow: { flex: 1, flexDirection: 'row' },
  narrowContainer: { flex: 1 },
  narrowSafeArea: { flex: 1 },
  content: { flex: 1, overflow: 'hidden' },
  contentInner: { flex: 1 },
  mobileContent: { flex: 1 },
  overlay: { ...ABSOLUTE_FILL_STYLE, zIndex: 10 },
  hoverZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: HOVER_ZONE_WIDTH,
    zIndex: 12,
  },
  hoverSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    zIndex: 11,
  },
  seamPillWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -SEAM_TOGGLE_HEIGHT / 2,
    width: SEAM_TOGGLE_WIDTH,
    height: SEAM_TOGGLE_HEIGHT,
    zIndex: 30,
  },
} as const;
