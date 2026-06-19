'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, TrendingUp, Search, PlusCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 text-center animate-fade-in">
      {/* Visual illustration / emoji wrapper */}
      <div className="relative mb-6">
        <div className="text-8xl md:text-9xl filter drop-shadow-md select-none animate-bounce-slow">
          ☕
        </div>
        <div className="absolute -bottom-2 -right-2 text-3xl animate-pulse">
          ⚠️
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-black font-[family-name:var(--font-poppins)] text-text-primary tracking-tight mb-3">
        Looks like this Tapri doesn't exist.
      </h1>
      
      <p className="text-text-muted text-sm md:text-base max-w-md mb-8 leading-relaxed">
        The neighborhood tea stall you are looking for has packed up or moved. Let's get you back to the active local discussions!
      </p>

      {/* Premium Search Box */}
      <form onSubmit={handleSearch} className="w-full max-w-md mb-8 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search localities, posts, or neighbors..."
          className="w-full bg-bg-card border border-border rounded-full py-3.5 pl-5 pr-12 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-2 focus:ring-blue-primary/10 transition-all text-sm sm:text-base shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-blue-primary hover:bg-blue-hover text-white rounded-full transition-all shadow-sm active:scale-95 cursor-pointer"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
      </form>

      {/* Navigation Shortcuts */}
      <div className="w-full max-w-lg">
        <p className="text-xs font-bold text-text-dim uppercase tracking-wider mb-4">
          Quick Shortcuts
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/">
            <button className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-bg-card hover:bg-bg-elevated hover:border-border-light hover:shadow-sm transition-all active:scale-[0.98] group cursor-pointer">
              <div className="p-2 bg-blue-primary/10 rounded-xl text-blue-primary group-hover:scale-110 transition-transform">
                <Home size={20} />
              </div>
              <span className="text-xs font-semibold text-text-primary">Home</span>
            </button>
          </Link>

          <Link href="/trending">
            <button className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-bg-card hover:bg-bg-elevated hover:border-border-light hover:shadow-sm transition-all active:scale-[0.98] group cursor-pointer">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
              </div>
              <span className="text-xs font-semibold text-text-primary">Trending</span>
            </button>
          </Link>

          <Link href="/search">
            <button className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-bg-card hover:bg-bg-elevated hover:border-border-light hover:shadow-sm transition-all active:scale-[0.98] group group-hover:scale-105 transition-all cursor-pointer">
              <div className="p-2 bg-teal-500/10 rounded-xl text-teal-500 group-hover:scale-110 transition-transform">
                <Search size={20} />
              </div>
              <span className="text-xs font-semibold text-text-primary">Search</span>
            </button>
          </Link>

          <Link href="/create">
            <button className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-bg-card hover:bg-bg-elevated hover:border-border-light hover:shadow-sm transition-all active:scale-[0.98] group cursor-pointer">
              <div className="p-2 bg-pink-500/10 rounded-xl text-pink-500 group-hover:scale-110 transition-transform">
                <PlusCircle size={20} />
              </div>
              <span className="text-xs font-semibold text-text-primary">Create Post</span>
            </button>
          </Link>
        </div>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-10 flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Go Back</span>
      </button>
    </div>
  );
}
