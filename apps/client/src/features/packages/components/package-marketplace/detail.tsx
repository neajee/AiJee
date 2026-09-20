import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, useWindowDimensions } from "@/platform/browser";
import { Download, ExternalLink, X } from 'lucide-react';
import { usePiClient } from '@aijee/client-sdk';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { Fonts } from '@/constants/theme';
import { AppModal } from '@/components/ui';
import { useSettingsMetrics, useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
import { Notice, PrimaryButton } from './shared';

// ─── Detail dialog ────────────────────────────────────────────

export function PackageDetail({
  pkg,
  onClose,
  onInstalled
}: {
  pkg: MarketplacePackage | null;
  onClose: () => void;
  onInstalled: (output: string) => void;
}) {
  const client = usePiClient();
  const m = useSettingsMetrics();
  const p = useSettingsPalette();
  const phone = useSettingsPhoneLayout();
  const {
    height: screenHeight
  } = useWindowDimensions();
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
        workspace_id: null
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
  return <AppModal visible onClose={onClose} contentStyle={[{
    backgroundColor: p.card,
    borderColor: p.border,
    borderRadius: phone ? 0 : m.cardRadius + 4,
    width: phone ? '100%' : 560,
    height: phone ? '100%' : undefined,
    maxHeight: phone ? undefined : maxHeight
  }]}>
        <div className={""}>
          <div className={"" + " " + "p-[gutter]"}>
            <div className={""}>
              <span className={"" + " " + "text-[0]"}>
                {pkg.name}
              </span>
              <span className={"" + " " + ""}>
                v{pkg.version}
                {pkg.author ? ` · ${pkg.author}` : ''}
                {pkg.package_types.length ? ` · ${pkg.package_types.join('、')}` : ''}
              </span>
            </div>
            <button onClick={onClose} role="button" aria-label="关闭" hitSlop={8} className={""}>
              <X size={16} color={p.textSecondary} strokeWidth={2} />
            </button>
          </div>

          <div>
            <span className={"text-[valueSize] leading-[0]"}>
              {pkg.description || '作者未提供介绍'}
            </span>

            {failure ? <Notice text={failure} tone="error" /> : null}

          </div>

          <div className={"" + " " + "p-[gutter]"}>
            {pkg.repository || pkg.homepage ? <button onClick={() => Linking.openURL((pkg.repository ?? pkg.homepage)!)} role="link" aria-label="打开仓库" className={""}>
                <ExternalLink size={13} color={p.textSecondary} strokeWidth={1.8} />
                <span className={"text-[descSize] font-sans"}>
                  仓库
                </span>
              </button> : <div />}
            <PrimaryButton label="安装" icon={Download} busy={installing} onClick={() => void install()} />
          </div>
        </div>
    </AppModal>;
}
