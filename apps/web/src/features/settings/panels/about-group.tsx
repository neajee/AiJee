import type { ReactNode } from "react";
/** Group header that survives the SettingsHeadingProvider suppression. */
export function AboutGroup({
  title,
  children,
  divided = false
}: {
  title: string;
  children: ReactNode;
  divided?: boolean;
}) {
  return <div className="flex flex-col gap-2">
      {divided ? <div className="flex items-center gap-3 py-2.5"><span className="h-px flex-1 bg-border" /><span className="text-body font-medium text-text-secondary">{title}</span><span className="h-px flex-1 bg-border" /></div> : <span className="px-[var(--header-inset)] text-left text-caption font-medium text-text-secondary">{title}</span>}
      {children}
    </div>;
}
