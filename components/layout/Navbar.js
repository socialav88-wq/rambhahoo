'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Menu, X, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const { user, profile, isLoading } = useAuthStore();
  const unreadCount = useUIStore((s) => s.unreadNotificationsCount);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-[1440px] px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" aria-label="Home" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-primary to-purple-secondary flex items-center justify-center">
              <Flame size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold font-[family-name:var(--font-poppins)] gradient-text hidden sm:block">
              Rambhahoo
            </span>
          </Link>
 
          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Rambhahoo..."
                className="w-full bg-bg-elevated border border-border rounded-xl py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/30 transition-all"
              />
            </div>
          </form>
 
          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Toggle Search"
              className="md:hidden p-2 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>
 
            {/* Create Post - desktop */}
            <Link
              href="/create"
              className="hidden md:flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-blue-primary hover:bg-blue-hover text-white rounded-lg shadow-sm transition-all"
            >
              <Flame size={16} />
              Create Post
            </Link>
 
            {isLoading ? (
              <div className="w-24 h-8 bg-bg-elevated border border-border rounded-xl animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/notifications"
                  className="p-2 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-primary transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent-red text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href={`/profile/${profile?.username || ''}`}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-card-hover transition-colors"
                >
                  <Avatar src={profile?.avatar_url} name={profile?.display_name} size="sm" />
                  <span className="hidden lg:block text-sm font-medium text-text-primary">
                    {profile?.display_name || profile?.username}
                  </span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="px-2.5 sm:px-4 py-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="hidden sm:block px-4 py-1.5 text-sm font-medium bg-blue-primary hover:bg-blue-hover text-white rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>


        {/* Mobile search - expandable */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-3 md:hidden animate-slide-up">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search discussions, memes, polls..."
                autoFocus
                className="w-full bg-bg-elevated border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary transition-all"
              />
            </div>
          </form>
        )}
      </div>
    </header>
  );
}
