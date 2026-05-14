import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-[var(--radius)]",
          "bg-surface border border-border px-4 text-sm",
          "text-foreground placeholder:text-muted/80",
          "transition-colors duration-200",
          "hover:border-border-strong",
          "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
