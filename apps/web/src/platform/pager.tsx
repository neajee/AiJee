import React, { forwardRef, useImperativeHandle, useRef } from "react";
export interface PagerHandle {
  setPage(index: number): void;
}
export const Pager = forwardRef<PagerHandle, any>(({
  children,
  onPageSelected,
  ...props
}, ref) => {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({
    setPage: (_index: number) => {}
  }));
  return <div ref={node} {...props}>{children}</div>;
});
