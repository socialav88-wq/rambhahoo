'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, PlusCircle, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/search', icon: Compass },
  { label: 'Create', href: '/create', icon: PlusCircle, isSpecial: true },
  { label: 'Trending', href: '/trending', icon: TrendingUp },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { profile } = useAuthStore();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-white/95 backdrop-blur-xl border-t border-border shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around h-16 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const href = item.label === 'Profile' && profile?.username
              ? `/profile/${profile.username}`
              : item.href;

            if (item.isSpecial) {
              return (
                <Link
                  key={item.label}
                  href={href}
                  className="flex items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-primary to-purple-secondary flex items-center justify-center shadow-lg shadow-blue-primary/30 active:scale-90 transition-transform">
                    <Icon size={24} className="text-white" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
                  active
                    ? 'text-blue-primary'
                    : 'text-text-dim hover:text-text-muted'
                )}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
                  {active && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-primary rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area for phones with home indicators */}
      <div className="bg-white h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
