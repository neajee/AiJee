import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Download, ExternalLink, X } from 'lucide-react-native';
import { usePiClient } from '@aijee/client-sdk';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { AppModal } from '@/components/ui';
import { useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { styles } from '../../utils/marketplace-styles';
import { Notice, PrimaryButton } from './shared';

// ─── Detail dialog ────────────────────────────────────────────

export function PackageDetail({
  pkg,
  onClose,
  onInstalled,
}: {
  pkg: MarketplacePackage | null;
  onClose: () => void;
  onInstalled: (output: string) => void;
}) {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const { height: screenHeight } = useWindowDimensions();

  const [installing, setInstalling] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const nameRef = useRef<string | null>(null);

  // Reset the form whenever a different package opens the dialog.
  useEffect(() => {
    if (!pkg || nameRef.current === pkg.name) return;
    nameRef.current = pkg.name;
    setInstalling(false);
    setFailure(null);
  }, [pkg]);

  const target = pkg?.version || 'latest';

  const install = useCallback(async () => {
    if (!pkg) return;
    setInstalling(true);
    setFailure(null);
    try {
      const result = await client.api.marketplaceOperation({
        operation: 'install',
        name: pkg.name,
        version: target,
        scope: 'user',
        lock_version: true,
        workspace_id: null,
      });
      onInstalled(result.output || '安装完成');
    } catch (e) {
      setFailure(e instanceof Error ? e.message : '安装失败');
    } finally {
      setInstalling(false);
    }
  }, [client, pkg, target, onInstalled]);

  if (!pkg) return null;

  const maxHeight = Math.min(screenHeight - 64, 680);

  return (
    <AppModal
      visible
      onClose={onClose}
      contentStyle={[
        styles.dialog,
        {
          backgroundColor: p.card,
          borderColor: p.border,
          borderRadius: phone ? 0 : m.cardRadius + 4,
          width: phone ? '100%' : 560,
          height: phone ? '100%' : undefined,
          maxHeight: phone ? undefined : maxHeight,
        },
      ]}
    >
        <View
          style={[
            styles.dialogInner,
          ]}
        >
          <View style={[styles.dialogHeader, { borderBottomColor: p.separator, padding: m.gutter }]}>
            <View style={styles.dialogTitleCol}>
              <Text
                style={[styles.dialogTitle, { color: p.text, fontSize: m.labelSize + 2 }]}
                numberOfLines={1}
              >
                {pkg.name}
              </Text>
              <Text style={[styles.meta, { color: p.textTertiary }]}>
                v{pkg.version}
                {pkg.author ? ` · ${pkg.author}` : ''}
                {pkg.package_types.length ? ` · ${pkg.package_types.join('、')}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="关闭"
              hitSlop={8}
              style={({ pressed, hovered }: any) => [
                styles.iconButton,
                hovered && { backgroundColor: p.pressed },
                pressed && { opacity: 0.6 },
              ]}
            >
              <X size={16} color={p.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: m.gutter, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ color: p.textSecondary, fontSize: m.valueSize, lineHeight: m.valueSize * 1.5 }}>
              {pkg.description || '作者未提供介绍'}
            </Text>

            {failure ? <Notice text={failure} tone="error" /> : null}

          </ScrollView>

          <View style={[styles.dialogFooter, { borderTopColor: p.separator, padding: m.gutter }]}>
            {pkg.repository || pkg.homepage ? (
              <Pressable
                onPress={() => Linking.openURL((pkg.repository ?? pkg.homepage)!)}
                accessibilityRole="link"
                accessibilityLabel="打开仓库"
                style={({ pressed, hovered }: any) => [
                  styles.linkButton,
                  hovered && { backgroundColor: p.pressed },
                  pressed && { opacity: 0.6 },
                ]}
              >
                <ExternalLink size={13} color={p.textSecondary} strokeWidth={1.8} />
                <Text style={{ fontSize: m.descSize, fontFamily: Fonts.sans, color: p.textSecondary }}>
                  仓库
                </Text>
              </Pressable>
            ) : (
              <View />
            )}
            <PrimaryButton
              label="安装"
              icon={Download}
              busy={installing}
              onPress={() => void install()}
            />
          </View>
        </View>
    </AppModal>
  );
}
