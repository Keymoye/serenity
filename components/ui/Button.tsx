"use client";

import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, className = '', disabled, type = 'button', ...rest }, ref) => {
    const base = 'inline-flex items-center justify-center rounded-full font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
    const sizes: Record<string,string> = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-3 text-base'
    };
    const variants: Record<Variant,string> = {
      primary: 'bg-stone-800 text-white hover:bg-stone-700 focus-visible:ring-stone-600',
      secondary: 'bg-white border border-slate-300 text-stone-800 hover:bg-slate-50 focus-visible:ring-slate-300',
      ghost: 'bg-transparent text-stone-700 hover:bg-slate-100 focus-visible:ring-slate-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400'
    };

    const isDisabled = Boolean(disabled) || loading;

    return (
      <button
        ref={ref}
        type={type}
        className={`${base} ${sizes[size]} ${variants[variant]} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        aria-disabled={isDisabled}
        aria-busy={loading || undefined}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? <span aria-hidden>Loading…</span> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
