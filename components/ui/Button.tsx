'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'subtle';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white',
  ghost: 'bg-transparent hover:bg-white/10 text-white/80',
  subtle: 'bg-white/10 hover:bg-white/20 text-white',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'rounded-xl px-4 py-3 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';
