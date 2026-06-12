'use client';

import { cn } from '@/lib/utils';

const VARIANTS = {
  primary: 'bg-blue-primary hover:bg-blue-hover text-white shadow-md shadow-blue-primary/15 hover:shadow-lg hover:shadow-blue-primary/20',
  secondary: 'bg-purple-secondary hover:bg-purple-hover text-white shadow-md shadow-purple-secondary/15 hover:shadow-lg hover:shadow-purple-secondary/20',
  ghost: 'bg-transparent hover:bg-bg-elevated text-text-muted hover:text-text-primary',
  outline: 'bg-transparent border border-border hover:border-blue-primary text-text-primary hover:text-blue-primary hover:bg-blue-primary/5',
  danger: 'bg-accent-red hover:bg-red-600 text-white shadow-md shadow-accent-red/15',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-primary/50 focus:ring-offset-2 focus:ring-offset-white',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.97]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}
