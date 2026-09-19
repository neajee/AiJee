import type { ReactNode } from "react";

export function VirtualList<T>({ data = [], renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, className }: { data?: T[]; renderItem?: (info: { item: T; index: number }) => ReactNode; keyExtractor?: (item: T, index: number) => string; ListEmptyComponent?: ReactNode; ListHeaderComponent?: ReactNode; className?: string }) {
  return <div className={className}>{ListHeaderComponent}{data.length ? data.map((item, index) => <div key={keyExtractor?.(item, index) ?? index}>{renderItem?.({ item, index })}</div>) : ListEmptyComponent}</div>;
}
