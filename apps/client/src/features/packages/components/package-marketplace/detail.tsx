import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, useWindowDimensions } from "@/platform/browser";
import { Download, ExternalLink, X } from 'lucide-react';
import { usePiClient } from '@aijee/client-sdk';
import type { MarketplacePackage } from '@aijee/client-sdk';
import { AppModal } from '@/components/ui';
import { useSettingsPalette, useSettingsPhoneLayout } from '@/components/settings-surface';
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
  const repoUrl = pkg.repository ?? pkg.homepage;
  return <AppModal visible onClose={onClose} contentStyle={[{
    backgroundColor: p.card,
    borderColor: p.border,
    width: phone ? '100%' : 560,
    maxWidth: phone ? '100%' : 560,
    height: phone ? '100%' : undefined,
    maxHeight: phone ? undefined : maxHeight
  }]}>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 border-b border-border pb-4">
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate font-sans text-[calc(var(--label-size)+2px)] font-semibold text-foreground">
                {pkg.name}
              </span>
              <span className="font-sans text-meta text-text-tertiary">
                v{pkg.version}
                {pkg.author ? ` · ${pkg.author}` : ''}
                {pkg.package_types.length ? ` · ${pkg.package_types.join('、')}` : ''}
              </span>
            </div>
            <button onClick={onClose} role="button" aria-label="关闭" className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-md transition-colors hover:bg-hover active:opacity-60">
              <X size={16} color={p.textSecondary} strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            <span className="font-sans text-[var(--value-size)] leading-[1.5] text-text-secondary">
              {pkg.description || '作者未提供介绍'}
            </span>
            {failure ? <Notice text={failure} tone="error" /> : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            {repoUrl ? <button onClick={() => Linking.openURL(repoUrl)} role="link" aria-label="打开仓库" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-text-secondary transition-colors hover:bg-hover active:opacity-60">
                <ExternalLink size={13} color={p.textSecondary} strokeWidth={1.8} />
                <span className="font-sans text-[var(--desc-size)]">
                  仓库
                </span>
              </button> : <div />}
            <PrimaryButton label="安装" icon={Download} busy={installing} onClick={() => void install()} />
          </div>
        </div>
    </AppModal>;
}
