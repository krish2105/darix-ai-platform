import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, icon, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyber-cyan focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group';
    
    const variants = {
      primary: 'bg-cyber-cyan text-deep-black hover:bg-electric-blue hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]',
      secondary: 'bg-glass-panel text-foreground border border-card-border hover:border-cyber-cyan/50 hover:bg-card',
      outline: 'border-2 border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/10',
      ghost: 'text-muted-foreground hover:text-foreground hover:bg-glass-panel',
    };

    const sizes = {
      sm: 'text-sm px-4 py-2 gap-2',
      md: 'text-base px-6 py-3 gap-2',
      lg: 'text-lg px-8 py-4 gap-3',
    };

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
        {icon && <span className="flex-shrink-0">{icon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
