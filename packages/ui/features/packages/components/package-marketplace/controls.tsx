import { Input, Text, View } from 'tamagui';
import { Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
import { CARD_MIN_WIDTH } from '../../utils/marketplace-constants';
import { styles } from '../../utils/marketplace-styles';

// ─── Header controls ──────────────────────────────────────────

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: p.tile, borderRadius: m.tileRadius + 2 },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={({ pressed, hovered }: any) => [
              styles.segment,
              { borderRadius: m.tileRadius },
              active && { backgroundColor: p.card, borderColor: p.separator },
              !active && hovered && { backgroundColor: p.pressed },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text
              style={{
                fontSize: m.descSize,
                fontFamily: active ? Fonts.sansMedium : Fonts.sans,
                color: active ? p.text : p.textTertiary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  onSubmit,
}: {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.search,
        { backgroundColor: p.tile, borderColor: p.separator, borderRadius: m.tileRadius },
      ]}
    >
      <Search size={14} color={p.textTertiary} strokeWidth={1.8} />
      <Input
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="搜索插件名称或关键词"
        placeholderTextColor={p.textTertiary}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="搜索插件"
        style={[styles.searchInput, { color: p.text, fontSize: m.valueSize }]}
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="清空搜索"
          hitSlop={6}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <X size={13} color={p.textTertiary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [
        styles.chip,
        { borderColor: active ? p.border : p.separator },
        active && { backgroundColor: p.tile },
        !active && hovered && { backgroundColor: p.pressed },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text
        style={{
          fontSize: m.descSize,
          fontFamily: active ? Fonts.sansMedium : Fonts.sans,
          color: active ? p.text : p.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── List ─────────────────────────────────────────────────────

export function PackageCard({
  pkg,
  single,
  onPress,
}: {
  pkg: MarketplacePackage;
  /** Narrow viewport: one card per row instead of a wrapping grid. */
  single: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pkg.name} 详情`}
      style={({ pressed, hovered }: any) => [
        styles.card,
        {
          backgroundColor: p.card,
          borderColor: p.separator,
          borderRadius: m.cardRadius,
          padding: m.gutter,
          width: single ? '100%' : undefined,
          flexBasis: single ? undefined : CARD_MIN_WIDTH,
        },
        hovered && { borderColor: p.border, backgroundColor: p.isDark ? p.tile : p.card },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.cardTop}>
        <Text
          style={[styles.cardName, { color: p.text, fontSize: m.labelSize }]}
          numberOfLines={1}
        >
          {pkg.name}
        </Text>
        <Text style={[styles.version, { color: p.textTertiary }]}>v{pkg.version}</Text>
      </View>
      <Text
        style={[styles.cardDesc, { color: p.textSecondary, fontSize: m.descSize }]}
        numberOfLines={2}
      >
        {pkg.description || '作者未提供介绍'}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.meta, { color: p.textTertiary }]} numberOfLines={1}>
          {pkg.package_types.join(' · ') || 'npm'}
        </Text>
        {pkg.downloads ? (
          <Text style={[styles.meta, { color: p.textTertiary }]}>
            {pkg.downloads.toLocaleString()} 次/周
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
