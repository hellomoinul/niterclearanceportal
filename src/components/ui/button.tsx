import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-[#fbc1ff] to-[#4e65ff] text-[#07172B] shadow-[var(--shadow-soft)] [inset-shadow:_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:from-[#fdcfff] hover:to-[#6b82ff] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-soft-hover)]",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-soft)] [inset-shadow:_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-destructive/90 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-soft-hover)]",
        outline:
          "border border-slate-200/60 bg-slate-50/80 backdrop-blur-sm text-accent-foreground shadow-[var(--shadow-soft)] [inset-shadow:_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-accent hover:text-accent-foreground hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-soft-hover)]",
        secondary: "bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 text-secondary-foreground shadow-[var(--shadow-soft)] [inset-shadow:_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 ease-out hover:bg-secondary/80 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[var(--shadow-soft-hover)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
