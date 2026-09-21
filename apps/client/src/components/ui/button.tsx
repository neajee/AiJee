import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-body font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", variant === "outline" && "border border-border bg-transparent", variant === "ghost" && "bg-transparent hover:bg-black/5", variant === "default" && "bg-primary text-white", size === "sm" && "px-3 py-1.5 text-caption", size === "lg" && "px-5 py-3", className)} {...props} />;
}
