import type { ReactNode } from "react";
export function TooltipProvider({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
export function Tooltip({
  children
}: {
  children: ReactNode;
}) {
  return <span className="relative inline-flex">{children}</span>;
}
export function TooltipTrigger({
  children
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
export function TooltipContent({
  children
}: {
  children: ReactNode;
}) {
  return <span className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background">{children}</span>;
}
