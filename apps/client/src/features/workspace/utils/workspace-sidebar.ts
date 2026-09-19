export const PANEL_DEFAULT = 280;
export const PANEL_MIN = 180;
export const PANEL_MAX = 1000;
export const PANEL_MAX_FRACTION = 0.72;
export const COLLAPSED_WIDTH = 38;
export const SEAM_HIT_WIDTH = 22;
export const SEAM_BAR_WIDTH = 4;
export const COLLAPSE_DURATION = 200;
export const SIDEBAR_WIDTH_KEY = 'workspace_sidebar_width';
export const SIDEBAR_COLLAPSED_KEY = 'workspace_sidebar_collapsed';
export const DEFAULT_SCOPE = 'session';

export interface ScopeState {
  width: number;
  widthLoaded: boolean;
  collapsed: boolean;
  collapsedLoaded: boolean;
}

const scopes = new Map<string, ScopeState>();

export function getScope(scope: string, defaultCollapsed: boolean): ScopeState {
  let state = scopes.get(scope);
  if (!state) {
    state = {
      width: PANEL_DEFAULT,
      widthLoaded: false,
      collapsed: defaultCollapsed,
      collapsedLoaded: false,
    };
    scopes.set(scope, state);
  }
  return state;
}

export function scopedKey(base: string, scope: string) {
  return scope === DEFAULT_SCOPE ? base : `${base}:${scope}`;
}

export function clampWidth(width: number) {
  return Math.max(PANEL_MIN, Math.min(PANEL_MAX, Math.round(width)));
}

export function parseStoredWidth(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clampWidth(parsed) : null;
}
