import type { ReactNode } from "react";
export function ScrollArea({
  className = "",
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={`overflow-auto ${className}`}>{children}</div>;
}
