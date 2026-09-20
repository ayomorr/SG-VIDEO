import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-12 w-full rounded-full border bg-card px-5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";