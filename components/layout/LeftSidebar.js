'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Home, TrendingUp, Search, Settings, MapPin, Flame, HelpCircle } from 'lucide-react';
import { LOCALITIES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ADVICE_CATEGORIES_MAP } from '@/components/advice/AdviceFeedCard';

const NAV_LINKS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Trending', href: '/trending', icon: TrendingUp },
  { label: 'Need Advice', href: '/advice', icon: HelpCircle },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localities, setLocalities] = useState(LOCALITIES);

  const activeCategory = searchParams.get('category') || null;
  const isAdvicePage = pathname.startsWith('/advice');

  const categories = Object.entries(ADVICE_CATEGORIES_MAP).map(([key, val]) => ({
    value: key,
    ...val
  }));

  const handleCategoryClick = (catVal) => {
    const params = new URLSearchParams(window.location.search);
    if (catVal) {
      params.set('category', catVal);
    } else {
      params.delete('category');
    }
    router.push(`/advice?${params.toString()}`);
  };

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('localities').select('*').order('name');
        if (data && data.length > 0) setLocalities(data);
      } catch (e) {}
    }
    load();
  }, []);

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

        {/* Advice Categories or Localities */}
        {isAdvicePage ? (
          <div className="bg-bg-card rounded-xl border border-border shadow-sm p-3">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-base text-purple-secondary font-semibold">🌐</span>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Categories</h3>
            </div>
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto no-scrollbar">
              <button
                onClick={() => handleCategoryClick(null)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left cursor-pointer font-medium',
                  activeCategory === null
                    ? 'bg-blue-primary/10 text-blue-primary'
                    : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
                )}
              >
                <span>🌐</span>
                <span className="truncate font-semibold">All Categories</span>
              </button>
              {categories.map((cat) => {
                const active = activeCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryClick(cat.value)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left cursor-pointer font-medium',
                      active
                        ? 'bg-blue-primary/10 text-blue-primary'
                        : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-bg-card rounded-xl border border-border shadow-sm p-3">
            <div className="flex items-center gap-2 px-2 mb-2">
              <MapPin size={16} className="text-purple-secondary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-dim">Localities</h3>
            </div>
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto no-scrollbar">
              {localities.map((locality) => {
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
            <div className="mt-2 pt-2 border-t border-border">
              <Link href="/create-locality" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-blue-primary hover:bg-bg-card-hover transition-all">
                <span className="text-base">➕</span>
                <span className="font-medium">Create Locality</span>
              </Link>
            </div>
          </div>
        )}

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
