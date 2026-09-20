import type { ReactNode } from "react";
export function DropdownMenu({
  children
}: {
  children: ReactNode;
}) {
  return <div className="relative inline-block">{children}</div>;
}
export function DropdownMenuTrigger({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
export function DropdownMenuContent({
  children
}: {
  children: ReactNode;
}) {
  return <div className="absolute right-0 z-20 mt-2 min-w-40 rounded-md border border-border bg-background p-1 shadow-lg">{children}</div>;
}
export function DropdownMenuItem({
  children,
  onClick
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return <button className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-black/5" onClick={onClick}>{children}</button>;
}
