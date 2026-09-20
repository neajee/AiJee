import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
export function AppModal({
  visible,
  onClose,
  children,
  contentStyle,
  closeOnBackdrop = true,
  title,
  showClose = false
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: CSSProperties | CSSProperties[];
  closeOnBackdrop?: boolean;
  title?: string;
  showClose?: boolean;
}) {
  const titleId = useId();
  const contentRef = useRef<HTMLElement>(null);
  const contentStyles = Array.isArray(contentStyle) ? contentStyle : contentStyle ? [contentStyle] : [];
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnBackdrop) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => contentRef.current?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [closeOnBackdrop, onClose, visible]);
  if (!visible) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4 backdrop-blur-[2px]" role="presentation" onMouseDown={event => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  }}>
      <section ref={contentRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl outline-none" style={Object.assign({}, ...contentStyles)} onMouseDown={event => event.stopPropagation()}>
        {title || showClose ? <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
          {title ? <h2 id={titleId} className="text-base font-semibold">{title}</h2> : <span />}
          {showClose ? <button type="button" className="flex size-8 items-center justify-center rounded-md text-xl text-muted-foreground hover:bg-hover" aria-label="Close" onClick={onClose}>×</button> : null}
        </header> : null}
        <div className="min-h-0 overflow-y-auto p-5">{children}</div>
      </section>
    </div>;
}
