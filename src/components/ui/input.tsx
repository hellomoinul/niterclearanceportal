import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-2xl bg-[#e4ebf5] text-base [box-shadow:inset_4px_4px_8px_#cbced1,inset_-4px_-4px_8px_#ffffff] border-none transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:shadow-[var(--shadow-soft-hover)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
