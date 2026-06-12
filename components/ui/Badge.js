import { cn } from '@/lib/utils';

const VARIANTS = {
  default: 'bg-bg-elevated text-text-muted border border-border',
  primary: 'bg-blue-primary/10 text-blue-primary border border-blue-primary/20',
  secondary: 'bg-purple-secondary/10 text-purple-secondary border border-purple-secondary/20',
  success: 'bg-accent-green/10 text-accent-green border border-accent-green/20',
  danger: 'bg-accent-red/10 text-accent-red border border-accent-red/20',
  warning: 'bg-accent-amber/10 text-accent-amber border border-accent-amber/20',
  trending: 'bg-gradient-to-r from-accent-red/10 to-accent-amber/10 text-accent-amber border border-accent-amber/20',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
      VARIANTS[variant],
      className
    )}>
      {children}
    </span>
  );
}
