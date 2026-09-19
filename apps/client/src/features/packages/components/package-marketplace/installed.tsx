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
  message
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
  return <div style={styles.scroll}>
      <div style={styles.installedHeader}>
        <span style={{
        fontSize: m.headerSize,
        fontFamily: Fonts.sansMedium,
        color: p.textSecondary
      }}>
          服务器上已安装的插件
        </span>
        <div style={styles.installedActions}><SecondaryButton label="全部更新" onClick={() => void client.api.marketplaceOperation({
          operation: 'update',
          name: '*',
          scope: 'user'
        })} /><SecondaryButton label="刷新" onClick={onRefresh} /></div>
      </div>

      {message ? <span style={[styles.operationMessage, {
      color: p.textSecondary,
      backgroundColor: p.tile,
      borderColor: p.separator,
      borderRadius: m.tileRadius
    }]}>{message}</span> : null}
      {error ? <Notice text={error} tone="error" /> : null}

      {loading ? <div style={styles.centered}><span size="small" color={p.textTertiary} /></div> : output === '暂无已安装插件' ? <span style={[styles.emptyText, {
      color: p.textTertiary,
      fontSize: m.descSize
    }]}>暂无已安装插件。</span> : <div style={styles.installedGrid}>
          {parseInstalledPackages(output).map((pkg, index) => <InstalledPackageCard key={`${pkg.name}-${index}`} pkg={pkg} single={single} onUpdate={() => void client.api.marketplaceOperation({
        operation: 'update',
        name: pkg.name,
        scope: 'user'
      }).then(onRefresh)} onRemove={() => void client.api.marketplaceOperation({
        operation: 'remove',
        name: pkg.name,
        scope: 'user'
      }).then(onRefresh)} />)}
        </div>}
    </div>;
}
type InstalledPackage = {
  name: string;
  detail: string | null;
};
function parseInstalledPackages(output: string | null): InstalledPackage[] {
  return (output ?? '').split(/\r?\n/).map(line => line.trim()).filter(line => line && line !== '暂无已安装插件').map(line => {
    const match = line.match(/^([^\s]+)(?:\s+\[([^\]]+)\])?(?:\s+(.*))?$/);
    return {
      name: match?.[1] || line,
      detail: [match?.[2], match?.[3]].filter(Boolean).join(' · ') || null
    };
  });
}
function InstalledPackageCard({
  pkg,
  single,
  onUpdate,
  onRemove
}: {
  pkg: InstalledPackage;
  single: boolean;
  onUpdate: () => void;
  onRemove: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  return <div style={[styles.installedCard, {
    backgroundColor: p.card,
    borderColor: p.separator,
    borderRadius: m.cardRadius,
    padding: m.gutter,
    width: single ? '100%' : undefined,
    flexBasis: single ? undefined : CARD_MIN_WIDTH
  }]}>
      <div style={styles.installedCardTop}>
        <div style={styles.installedCopy}>
          <span style={[styles.installedName, {
          color: p.text,
          fontSize: m.labelSize
        }]}>{pkg.name}</span>
          {pkg.detail ? <span style={[styles.meta, {
          color: p.textTertiary
        }]}>{pkg.detail}</span> : null}
        </div>
      </div>
      <div style={[styles.installedFooter, {
      borderTopColor: p.separator
    }]}>
        <InstalledAction label="更新" onClick={onUpdate} />
        <InstalledAction label="卸载" destructive onClick={onRemove} />
      </div>
    </div>;
}
function InstalledAction({
  label,
  destructive = false,
  onPress
}: {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const color = destructive ? p.destructive : p.textSecondary;
  return <button onClick={onPress} role="button" aria-label={label} style={({
    pressed,
    hovered
  }: any) => [styles.installedAction, hovered && {
    backgroundColor: p.pressed
  }, pressed && {
    opacity: 0.6
  }]}>
      <span style={{
      color,
      fontSize: m.descSize,
      fontFamily: Fonts.sansMedium
    }}>{label}</span>
    </button>;
}
