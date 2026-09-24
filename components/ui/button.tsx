"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "glass"
  | "coral";
type Size = "sm" | "md" | "lg" | "xl";

const base =
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all duration-300 ease-out focus-visible:outline-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(0,194,168,0.45)] hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-[0_14px_38px_-8px_rgba(0,194,168,0.6)] active:translate-y-0",
  secondary:
    "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground",
  outline:
    "border border-border bg-transparent text-foreground hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary",
  ghost: "text-foreground hover:bg-muted",
  glass:
    "glass text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary",
  coral:
    "bg-destructive text-destructive-foreground shadow-[0_10px_30px_-8px_rgba(255,107,90,0.4)] hover:-translate-y-0.5",
};

const sizes: Record<Size, string> = {
  sm: "h-11 px-6 text-[15px]",
  md: "h-14 px-8 text-base",
  lg: "h-16 px-10 text-lg",
  xl: "h-20 px-14 text-xl",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export type { Variant as ButtonVariant, Size as ButtonSize };