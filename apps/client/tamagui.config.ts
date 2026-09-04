import { createTamagui } from 'tamagui';
import { TAMAGUI_COLOR_TOKENS, TAMAGUI_DARK_COLOR_TOKENS, TAMAGUI_THEMES } from '../../packages/ui/constants/theme-static';

export default createTamagui({
  tokens: {
    color: {
      ...TAMAGUI_COLOR_TOKENS,
    },
    space: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, true: 16 },
    size: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, true: 16 },
    radius: { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, true: 4 },
    zIndex: { 0: 0, 1: 1, 2: 10 },
  },
  themes: {
    light: {
      ...TAMAGUI_COLOR_TOKENS,
      ...TAMAGUI_THEMES.light,
    },
    dark: {
      ...TAMAGUI_DARK_COLOR_TOKENS,
      ...TAMAGUI_THEMES.dark,
    },
  },
  defaultProps: {
    Text: { textAlign: 'left' },
  },
  shorthands: {
    bg: 'backgroundColor',
    p: 'padding',
    px: 'paddingHorizontal',
    py: 'paddingVertical',
  },
});
