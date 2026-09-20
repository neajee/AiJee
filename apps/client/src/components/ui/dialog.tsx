import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/utils";
const DialogContext = createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({
  open: false
});
export function Dialog({
  open,
  onOpenChange,
  children
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  return <DialogContext.Provider value={{
    open,
    onOpenChange
  }}>{children}</DialogContext.Provider>;
}
export function DialogTrigger({
  children
}: {
  children: ReactNode;
}) {
  const ctx = useContext(DialogContext);
  return <span onClick={() => ctx.onOpenChange?.(true)}>{children}</span>;
}
export function DialogContent({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx.open) return null;
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => ctx.onOpenChange?.(false)}><div className={cn("w-full max-w-lg rounded-lg bg-background p-6 text-foreground shadow-xl", className)} onClick={event => event.stopPropagation()}>{children}</div></div>;
}
export function DialogTitle({
  children
}: {
  children: ReactNode;
}) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
export function DialogDescription({
  children
}: {
  children: ReactNode;
}) {
  return <p className="mt-1 text-sm text-muted-foreground">{children}</p>;
}
export function DialogClose({
  children
}: {
  children: ReactNode;
}) {
  const ctx = useContext(DialogContext);
  return <span onClick={() => ctx.onOpenChange?.(false)}>{children}</span>;
}
