import { cn } from '@/lib/utils';

export default function Skeleton({ className = '', variant = 'rect' }) {
  const baseClass = 'skeleton-shimmer rounded';
  
  if (variant === 'circle') {
    return <div className={cn(baseClass, 'rounded-full', className)} />;
  }
  
  if (variant === 'text') {
    return <div className={cn(baseClass, 'h-4 w-full', className)} />;
  }
  
  return <div className={cn(baseClass, className)} />;
}

export function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-border shadow-sm animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1">
          <Skeleton variant="text" className="w-24 mb-1" />
          <Skeleton variant="text" className="w-16 h-3" />
        </div>
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-3/4 mb-2" />
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-1/2 mb-4" />
      <div className="flex gap-4">
        <Skeleton className="w-12 h-6 rounded-full" />
        <Skeleton className="w-12 h-6 rounded-full" />
        <Skeleton className="w-12 h-6 rounded-full" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
