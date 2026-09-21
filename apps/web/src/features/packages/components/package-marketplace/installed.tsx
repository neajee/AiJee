import { usePiClient } from '@aijee/client-sdk';
import { Notice, SecondaryButton } from './shared';
export function InstalledView({
  output,
  loading,
  error,
  onRefresh,
  single,
  message
}: {
  output: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  single: boolean;
  message: string | null;
}) {
  const client = usePiClient();
  return <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-sans text-[var(--header-size)] font-medium text-text-secondary">
            服务器上已安装的插件
          </span>
          <div className="flex items-center gap-2"><SecondaryButton label="全部更新" onClick={() => void client.api.marketplaceOperation({
          operation: 'update',
          name: '*',
          scope: 'user'
        })} /><SecondaryButton label="刷新" onClick={onRefresh} /></div>
        </div>

        {message ? <span className="rounded-[var(--tile-radius)] border border-border bg-active px-2.5 py-2 font-sans text-caption text-text-secondary">{message}</span> : null}
        {error ? <Notice text={error} tone="error" /> : null}

        {loading ? <div className="flex items-center justify-center py-8"><span className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-text-tertiary" /></div> : output === '暂无已安装插件' ? <span className="py-2 font-sans text-[var(--desc-size)] text-text-tertiary">暂无已安装插件。</span> : <div className="flex flex-wrap items-stretch gap-3">
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
      </div>
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
  return <div className={`flex flex-col gap-3.5 rounded-[var(--card-radius)] border border-border bg-card p-[var(--gutter)] min-h-[112px] justify-between ${single ? 'w-full' : 'grow min-w-[340px] max-w-[560px] basis-[340px]'}`}>
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="truncate font-sans text-[var(--label-size)] font-medium text-foreground">{pkg.name}</span>
          {pkg.detail ? <span className="font-sans text-meta text-text-tertiary">{pkg.detail}</span> : null}
        </div>
      </div>
      <div className="flex items-center gap-0.5 self-stretch border-t border-border pt-2">
        <InstalledAction label="更新" onClick={onUpdate} />
        <InstalledAction label="卸载" destructive onClick={onRemove} />
      </div>
    </div>;
}
function InstalledAction({
  label,
  destructive = false,
  onClick
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return <button onClick={onClick} role="button" aria-label={label} className={`inline-flex items-center gap-1.5 rounded-[5px] px-[7px] py-[5px] transition-colors hover:bg-hover active:opacity-60 ${destructive ? 'text-destructive' : 'text-text-secondary'}`}>
      <span className="font-sans text-[var(--desc-size)] font-medium">{label}</span>
    </button>;
}
