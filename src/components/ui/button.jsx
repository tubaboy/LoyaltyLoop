import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-black shadow-brutalist hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutalist-lg",
        destructive:
          "bg-destructive text-white border-2 border-black shadow-brutalist hover:bg-destructive/90",
        outline:
          "border-2 border-black bg-background shadow-brutalist hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-black shadow-brutalist hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brutalist: "bg-primary text-black border-2 border-black shadow-brutalist hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutalist-lg",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-10 text-lg",
        xl: "h-20 px-12 text-2xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
