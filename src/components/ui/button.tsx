import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card/80 backdrop-blur-sm shadow-xs hover:border-primary/40 hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-electric text-primary-foreground shadow-glow hover:brightness-110 hover:-translate-y-0.5 transition-all",
        glass:
          "border border-white/15 bg-white/10 text-night-foreground backdrop-blur-md hover:bg-white/20 hover:border-white/30",
        neo: "border-2 border-foreground bg-card text-foreground shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)] dark:border-border dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)] hover:-translate-y-0.5 hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,0.95)] dark:hover:shadow-[3.5px_3.5px_0px_0px_rgba(0,0,0,0.95)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        sticker:
          "border-2 border-slate-900 bg-[#D9F99D] text-slate-950 font-bold shadow-[2.5px_2.5px_0px_0px_rgba(15,23,42,0.95)] hover:bg-[#bef264] hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none dark:border-white/40 dark:shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,0.95)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-sm",
        icon: "h-9 w-9",
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
