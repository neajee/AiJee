import React from "react";

export default function Svg({ children, width = 24, height = 24, viewBox = "0 0 24 24", ...props }: any) {
  return <svg width={width} height={height} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>{children}</svg>;
}
export const Path = (props: any) => <path {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const Line = (props: any) => <line {...props} />;
export const G = (props: any) => <g {...props} />;
