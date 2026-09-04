import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { usePiClient } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { useSettingsMetrics, useSettingsPalette } from '@/components/settings-surface';
import { styles } from '../../utils/marketplace-styles';
import { Notice, SecondaryButton } from './shared';
import { CARD_MIN_WIDTH } from '../../utils/marketplace-constants';

export function InstalledView({
  output,
  loading,
  error,
  onRefresh,
  gutter,
  single,
  message,
}: {
  output: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  gutter: number;
  single: boolean;
  message: string | null;
}) {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ padding: gutter, gap: 10 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.installedHeader}>
        <Text style={{ fontSize: m.headerSize, fontFamily: Fonts.sansMedium, color: p.textSecondary }}>
          服务器上已安装的插件
        </Text>
        <View style={styles.installedActions}><SecondaryButton label="全部更新" onPress={() => void client.api.marketplaceOperation({ operation: 'update', name: '*', scope: 'user' })} /><SecondaryButton label="刷新" onPress={onRefresh} /></View>
      </View>

      {message ? <Text style={[styles.operationMessage, { color: p.textSecondary, backgroundColor: p.tile, borderColor: p.separator, borderRadius: m.tileRadius }]}>{message}</Text> : null}
      {error ? <Notice text={error} tone="error" /> : null}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="small" color={p.textTertiary} /></View>
      ) : output === '暂无已安装插件' ? (
        <Text style={[styles.emptyText, { color: p.textTertiary, fontSize: m.descSize }]}>暂无已安装插件。</Text>
      ) : (
        <View style={styles.installedGrid}>
          {parseInstalledPackages(output).map((pkg, index) => (
            <InstalledPackageCard
              key={`${pkg.name}-${index}`}
              pkg={pkg}
              single={single}
              onUpdate={() => void client.api.marketplaceOperation({ operation: 'update', name: pkg.name, scope: 'user' }).then(onRefresh)}
              onRemove={() => void client.api.marketplaceOperation({ operation: 'remove', name: pkg.name, scope: 'user' }).then(onRefresh)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

type InstalledPackage = { name: string; detail: string | null };

function parseInstalledPackages(output: string | null): InstalledPackage[] {
  return (output ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '暂无已安装插件')
    .map((line) => {
      const match = line.match(/^([^\s]+)(?:\s+\[([^\]]+)\])?(?:\s+(.*))?$/);
      return {
        name: match?.[1] || line,
        detail: [match?.[2], match?.[3]].filter(Boolean).join(' · ') || null,
      };
    });
}

function InstalledPackageCard({
  pkg,
  single,
  onUpdate,
  onRemove,
}: {
  pkg: InstalledPackage;
  single: boolean;
  onUpdate: () => void;
  onRemove: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();

  return (
    <View
      style={[
        styles.installedCard,
        {
          backgroundColor: p.card,
          borderColor: p.separator,
          borderRadius: m.cardRadius,
          padding: m.gutter,
          width: single ? '100%' : undefined,
          flexBasis: single ? undefined : CARD_MIN_WIDTH,
        },
      ]}
    >
      <View style={styles.installedCardTop}>
        <View style={styles.installedCopy}>
          <Text style={[styles.installedName, { color: p.text, fontSize: m.labelSize }]} numberOfLines={1}>{pkg.name}</Text>
          {pkg.detail ? <Text style={[styles.meta, { color: p.textTertiary }]} numberOfLines={1}>{pkg.detail}</Text> : null}
        </View>
      </View>
      <View style={[styles.installedFooter, { borderTopColor: p.separator }]}>
        <InstalledAction label="更新" onPress={onUpdate} />
        <InstalledAction label="卸载" destructive onPress={onRemove} />
      </View>
    </View>
  );
}

function InstalledAction({
  label,
  destructive = false,
  onPress,
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = destructive ? p.destructive : p.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed, hovered }: any) => [styles.installedAction, hovered && { backgroundColor: p.pressed }, pressed && { opacity: 0.6 }]}
    >
      <Text style={{ color, fontSize: m.descSize, fontFamily: Fonts.sansMedium }}>{label}</Text>
    </Pressable>
  );
}
