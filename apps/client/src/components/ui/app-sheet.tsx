import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

export function AppSheet({
  visible,
  onClose,
  children,
  title,
  height,
  className = "",
  closeOnBackdrop = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  height?: number | string;
  className?: string;
  closeOnBackdrop?: boolean;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnBackdrop) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => sheetRef.current?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeOnBackdrop, onClose, visible]);
  if (!visible) return null;
  const style: CSSProperties | undefined = height ? { height } : undefined;
  return <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px]" role="presentation" onMouseDown={event => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  }}>
    <section ref={sheetRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} style={style} className={`absolute inset-x-0 bottom-0 flex max-h-[80dvh] min-h-0 flex-col overflow-hidden rounded-t-xl border border-b-0 border-border bg-card text-foreground shadow-2xl outline-none ${className}`} onMouseDown={event => event.stopPropagation()}>
      <div className="relative flex shrink-0 items-center justify-center border-b border-border px-4 py-2">
        <span className="h-1 w-8 rounded-full bg-muted" />
        {title ? <h2 id={titleId} className="absolute left-4 text-xs font-semibold">{title}</h2> : null}
        <button type="button" className="absolute right-2 flex size-7 items-center justify-center rounded-md text-lg text-muted-foreground hover:bg-hover" aria-label="Close" onClick={onClose}>×</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 text-sm">{children}</div>
    </section>
  </div>;
}
