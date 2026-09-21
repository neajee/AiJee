import { useEffect, useRef, type ComponentType, type ReactNode } from "react";

export function AppMenu({
  visible,
  top,
  left,
  children,
  width = 190,
  onClose,
}: {
  visible: boolean;
  top: number;
  left: number;
  children: ReactNode;
  width?: number;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!visible) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>("[data-menu-item]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, visible]);
  if (!visible) return null;
  return <div ref={menuRef} role="menu" className="fixed z-[80] max-h-[min(72dvh,400px)] min-w-32 overflow-y-auto rounded-md border border-border bg-card p-1 text-foreground shadow-xl" style={{ top, left, width }}>
    {children}
  </div>;
}

export function AppMenuItem({
  icon: Icon,
  children,
  onClick,
  danger = false,
}: {
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return <button type="button" data-menu-item role="menuitem" className={`flex h-7 w-full items-center gap-1.5 rounded px-1.5 text-left text-caption outline-none transition-colors hover:bg-hover focus:bg-hover ${danger ? "text-error" : "text-foreground"}`} onClick={onClick}>
    {Icon ? <Icon size={14} strokeWidth={1.8} /> : null}
    <span className="min-w-0 flex-1 truncate">{children}</span>
  </button>;
}

export function AppMenuSeparator() {
  return <div role="separator" className="my-1 border-t border-border" />;
}
