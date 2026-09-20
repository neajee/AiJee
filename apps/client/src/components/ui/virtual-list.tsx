import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
export const VirtualList = forwardRef<HTMLDivElement, any>(function VirtualList<T>({
  data = [],
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  className
}: {
  data?: T[];
  renderItem?: (info: {
    item: T;
    index: number;
  }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: ReactNode;
  ListHeaderComponent?: ReactNode;
  className?: string;
  [key: string]: unknown;
}, ref) {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => node.current as HTMLDivElement);
  return <div ref={node} className={className}>{ListHeaderComponent}{data.length ? data.map((item, index) => <div key={keyExtractor?.(item, index) ?? index}>{renderItem?.({
        item,
        index
      })}</div>) : ListEmptyComponent}</div>;
});
