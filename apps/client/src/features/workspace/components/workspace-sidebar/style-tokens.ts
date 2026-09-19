import {
  COLLAPSED_WIDTH,
  SEAM_BAR_WIDTH,
  SEAM_HIT_WIDTH,
} from '../../utils/workspace-sidebar';

export const styles = {
  container: {
    borderLeftWidth: 0.633,
    flexDirection: 'row',
    position: 'relative',
  },
  clip: { flex: 1, overflow: 'hidden' },
  activityBar: {
    width: COLLAPSED_WIDTH,
    alignItems: 'center',
    paddingTop: 6,
    gap: 2,
  },
  railButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  railButtonActive: { backgroundColor: 'rgba(136,136,136,0.16)' },
  seam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -(SEAM_HIT_WIDTH / 2),
    width: SEAM_HIT_WIDTH,
    alignItems: 'center',
    zIndex: 20,
    cursor: 'col-resize',
  } as any,
  seamBar: { width: SEAM_BAR_WIDTH, height: '100%', borderRadius: SEAM_BAR_WIDTH / 2 },
  seamToggleWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    zIndex: 30,
  },
} as const;
