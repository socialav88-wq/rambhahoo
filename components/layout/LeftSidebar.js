'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Search, Settings, MapPin, Flame } from 'lucide-react';
import { LOCALITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Trending', href: '/trending', icon: TrendingUp },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-[72px] space-y-4 pb-8 max-h-[calc(100vh-72px)] overflow-y-auto no-scrollbar">
        {/* Navigation */}
        <nav className="bg-bg-card rounded-xl border border-border shadow-sm p-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-primary/10 text-blue-primary'
                    : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
                )}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Localities */}
        <div className="bg-bg-card rounded-xl border border-border shadow-sm p-3">
          <div className="flex items-center gap-2 px-2 mb-2">
            <MapPin size={16} className="text-purple-secondary" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Localities</h3>
          </div>
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto no-scrollbar">
            {LOCALITIES.map((locality) => {
              const active = pathname === `/${locality.slug}`;
              return (
                <Link
                  key={locality.slug}
                  href={`/${locality.slug}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                    active
                      ? 'bg-purple-secondary/10 text-purple-secondary font-medium'
                      : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
                  )}
                >
                  <span className="text-base">{locality.emoji}</span>
                  <span className="truncate">{locality.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 text-xs text-text-dim">
          <p className="flex items-center gap-1">
            <Flame size={12} className="text-accent-amber" />
            Rambhahoo — Your neighborhood internet
          </p>
          <p className="mt-1">© 2025 Rambhahoo. Made with ❤️ in Hyderabad</p>
        </div>
      </div>
    </aside>
  );
}
