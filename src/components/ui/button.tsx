import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — primitivo do design system.
 *
 * variant:
 *  - primary: dourado sólido sobre background — CTA principal
 *  - outline: borda dourada com fundo transparente — CTA secundário
 *  - ghost: sem borda, apenas hover sutil — links de ação dentro de cards
 *  - link: sublinhado animado, herda cor do texto — usado dentro de parágrafos
 *
 * Microinteração: scale 0.99 no :active e transição refined (ease cubic-bezier).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap",
    "font-sans font-medium tracking-wide",
    "transition-all duration-200 ease-[var(--ease-refined)]",
    "active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-background hover:bg-accent-hover shadow-[0_1px_0_rgba(0,0,0,0.4)]",
        outline:
          "border border-accent/70 text-accent hover:bg-accent-soft hover:border-accent",
        ghost:
          "text-foreground/80 hover:text-foreground hover:bg-surface-2",
        link:
          "text-accent underline-offset-4 hover:underline px-0 py-0 h-auto",
        subtle:
          "bg-surface-2 text-foreground border border-border hover:border-border-strong",
      },
      size: {
        sm: "h-9 px-4 text-sm rounded-[var(--radius-sm)]",
        md: "h-11 px-6 text-sm rounded-[var(--radius)]",
        lg: "h-14 px-8 text-base rounded-[var(--radius)] uppercase tracking-[0.18em]",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
