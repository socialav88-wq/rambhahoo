'use client';

import { FEED_FILTERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function FeedFilters({ active = 'hot', onChange }) {
  return (
    <div className="flex w-full gap-1 p-1 bg-bg-card rounded-xl border border-border shadow-sm">
      {FEED_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onChange && onChange(filter.value)}
          className={cn(
            'flex-1 px-2 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all text-center',
            active === filter.value
              ? 'bg-blue-primary text-white shadow-md shadow-blue-primary/20'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-card-hover'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
