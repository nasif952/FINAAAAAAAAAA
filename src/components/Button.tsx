import { Button as ShadcnButton } from "@/components/ui/button";
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        gold: "bg-diamond-gold text-diamond-black hover:bg-diamond-darkGold shadow-sm",
        dark: "bg-diamond-black text-white hover:bg-diamond-darkGray shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    iconLeft,
    iconRight,
    isLoading,
    disabled,
    children,
    ...props
  }, ref) => {
    // Use the ShadcnButton directly instead of reimplementing
    return (
      <ShadcnButton
        className={className}
        variant={variant}
        size={size}
        asChild={asChild}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        <>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {!isLoading && iconLeft}
          {children}
          {iconRight}
        </>
      </ShadcnButton>
    );
  }
);

Button.displayName = "Button";
