import { toTailwind } from "@/styles/to-tailwind";
import { Search, X } from 'lucide-react';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
import { CARD_MIN_WIDTH } from '../../utils/marketplace-constants';
import { styles } from '../../utils/marketplace-styles';

// ─── Header controls ──────────────────────────────────────────

export function Segmented({
  options,
  value,
  onChange
}: {
  options: {
    value: string;
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className={toTailwind([styles.segmented, {
    backgroundColor: p.tile,
    borderRadius: m.tileRadius + 2
  }])}>
      {options.map(option => {
      const active = option.value === value;
      return <button key={option.value} onClick={() => onChange(option.value)} role="button" accessibilityState={{
        selected: active
      }} aria-label={option.label} className={toTailwind(({
        pressed,
        hovered
      }: any) => [styles.segment, {
        borderRadius: m.tileRadius
      }, active && {
        backgroundColor: p.card,
        borderColor: p.separator
      }, !active && hovered && {
        backgroundColor: p.pressed
      }, pressed && {
        opacity: 0.6
      }])}>
            <span className={toTailwind({
          fontSize: m.descSize,
          fontFamily: active ? Fonts.sansMedium : Fonts.sans,
          color: active ? p.text : p.textTertiary
        })}>
              {option.label}
            </span>
          </button>;
    })}
    </div>;
}
export function SearchField({
  value,
  onChangeText,
  onSubmit
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div className={toTailwind([styles.search, {
    backgroundColor: p.tile,
    borderColor: p.separator,
    borderRadius: m.tileRadius
  }])}>
      <Search size={14} color={p.textTertiary} strokeWidth={1.8} />
      <input value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} placeholder="搜索插件名称或关键词" placeholderTextColor={p.textTertiary} returnKeyType="search" autoCapitalize="none" autoCorrect={false} aria-label="搜索插件" className={toTailwind([styles.searchInput, {
      color: p.text,
      fontSize: m.valueSize
    }])} />
      {value ? <button onClick={() => onChangeText('')} role="button" aria-label="清空搜索" hitSlop={6} className={toTailwind(({
      pressed
    }) => [pressed && {
      opacity: 0.6
    }])}>
          <X size={13} color={p.textTertiary} strokeWidth={2} />
        </button> : null}
    </div>;
}
export function Chip({
  label,
  active,
  onPress
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" accessibilityState={{
    selected: active
  }} aria-label={label} className={toTailwind(({
    pressed,
    hovered
  }: any) => [styles.chip, {
    borderColor: active ? p.border : p.separator
  }, active && {
    backgroundColor: p.tile
  }, !active && hovered && {
    backgroundColor: p.pressed
  }, pressed && {
    opacity: 0.6
  }])}>
      <span className={toTailwind({
      fontSize: m.descSize,
      fontFamily: active ? Fonts.sansMedium : Fonts.sans,
      color: active ? p.text : p.textSecondary
    })}>
        {label}
      </span>
    </button>;
}

// ─── List ─────────────────────────────────────────────────────

export function PackageCard({
  pkg,
  single,
  onPress
}: {
  pkg: MarketplacePackage;
  /** Narrow viewport: one card per row instead of a wrapping grid. */
  single: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <button onClick={onPress} role="button" aria-label={`${pkg.name} 详情`} className={toTailwind(({
    pressed,
    hovered
  }: any) => [styles.card, {
    backgroundColor: p.card,
    borderColor: p.separator,
    borderRadius: m.cardRadius,
    padding: m.gutter,
    width: single ? '100%' : undefined,
    flexBasis: single ? undefined : CARD_MIN_WIDTH
  }, hovered && {
    borderColor: p.border,
    backgroundColor: p.isDark ? p.tile : p.card
  }, pressed && {
    opacity: 0.75
  }])}>
      <div className={toTailwind(styles.cardTop)}>
        <span className={toTailwind([styles.cardName, {
        color: p.text,
        fontSize: m.labelSize
      }])}>
          {pkg.name}
        </span>
        <span className={toTailwind([styles.version, {
        color: p.textTertiary
      }])}>v{pkg.version}</span>
      </div>
      <span className={toTailwind([styles.cardDesc, {
      color: p.textSecondary,
      fontSize: m.descSize
    }])}>
        {pkg.description || '作者未提供介绍'}
      </span>
      <div className={toTailwind(styles.cardBottom)}>
        <span className={toTailwind([styles.meta, {
        color: p.textTertiary
      }])}>
          {pkg.package_types.join(' · ') || 'npm'}
        </span>
        {pkg.downloads ? <span className={toTailwind([styles.meta, {
        color: p.textTertiary
      }])}>
            {pkg.downloads.toLocaleString()} 次/周
          </span> : null}
      </div>
    </button>;
}
