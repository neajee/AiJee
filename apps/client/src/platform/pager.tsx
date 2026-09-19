import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View } from "@/components/dom";

export interface PagerHandle { setPage(index: number): void; }
export const Pager = forwardRef<PagerHandle, any>(({ children, onPageSelected, ...props }, ref) => {
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => ({ setPage: (_index: number) => {} }));
  return <View ref={node} {...props}>{children}</View>;
});
