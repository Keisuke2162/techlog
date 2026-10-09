'use client';

import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background hover:border-primary/40 flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
