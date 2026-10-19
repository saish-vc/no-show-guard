import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-indigo-100 text-indigo-800 border-transparent',
    secondary: 'bg-zinc-100 text-zinc-800 border-transparent',
    outline: 'border-zinc-200 text-zinc-700 bg-white',
    success: 'bg-emerald-100 text-emerald-800 border-transparent',
    warning: 'bg-amber-100 text-amber-800 border-transparent',
    destructive: 'bg-red-100 text-red-800 border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
