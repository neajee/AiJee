import { forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes, type ReactNode, type RefAttributes } from "react";
import type React from "react";
type VirtualListProps<T> = {
  data?: T[];
  renderItem?: (info: {
    item: T;
    index: number;
  }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: ReactNode;
  ListHeaderComponent?: ReactNode;
  className?: string;
  onLayout?: () => void;
  nestedScrollEnabled?: boolean;
  getItemLayout?: unknown;
  onScrollToIndexFailed?: unknown;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;
export type VirtualListHandle = HTMLDivElement & {
  scrollToEnd: (options?: { animated?: boolean }) => void;
};
function VirtualListInner<T>({
  data = [],
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  className,
  onLayout,
  nestedScrollEnabled: _nestedScrollEnabled,
  getItemLayout: _getItemLayout,
  onScrollToIndexFailed: _onScrollToIndexFailed,
  ...rest
}: VirtualListProps<T>, ref: React.ForwardedRef<VirtualListHandle>) {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => {
    const element = node.current as VirtualListHandle;
    element.scrollToEnd = () => element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
    return element;
  });
  useEffect(() => {
    onLayout?.();
  }, [onLayout, data.length]);
  return <div ref={node} className={className} {...rest}>{ListHeaderComponent}{data.length ? data.map((item, index) => <div key={keyExtractor?.(item, index) ?? index}>{renderItem?.({
        item,
        index
      })}</div>) : ListEmptyComponent}</div>;
}
export const VirtualList = forwardRef(VirtualListInner) as <T>(props: VirtualListProps<T> & RefAttributes<VirtualListHandle>) => React.ReactElement;
