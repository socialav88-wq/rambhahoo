'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, User, Building2, Tag, Loader2 } from 'lucide-react';
import { getSearchSuggestions } from '@/app/actions/posts';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';

export default function SearchBar({ initialQuery = '', className = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState({ users: [], localities: [], businesses: [], tags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef(null);

  // Sync state with prop updates (e.g., when navigating between search pages)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete suggestions fetching
  useEffect(() => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      setSuggestions({ users: [], localities: [], businesses: [], tags: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = await getSearchSuggestions(cleanQuery);
        setSuggestions(res || { users: [], localities: [], businesses: [], tags: [] });
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 250); // Fast 250ms debounce for snappy feel

    return () => clearTimeout(handler);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (path, displayValue) => {
    setQuery(displayValue);
    setShowSuggestions(false);
    router.push(path);
  };

  const hasSuggestions = 
    suggestions.users.length > 0 || 
    suggestions.localities.length > 0 || 
    suggestions.businesses.length > 0 || 
    suggestions.tags.length > 0;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSearch} className="relative w-full">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setShowSuggestions(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          placeholder="Search localities, posts, tags, or businesses..."
          className="w-full bg-bg-card border border-border rounded-2xl py-3 pl-12 pr-12 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 shadow-sm transition-all text-base"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && <Loader2 size={16} className="text-blue-primary animate-spin mr-1" />}
          <button 
            type="submit"
            className="bg-blue-primary hover:bg-blue-hover text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Autocomplete Dropdown */}
      {showSuggestions && (query.trim().length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl overflow-hidden z-50 max-h-[420px] overflow-y-auto animate-fade-in divide-y divide-border/50">
          
          {loading && !hasSuggestions && (
            <div className="flex items-center justify-center py-6 text-sm text-text-muted gap-2">
              <Loader2 size={16} className="animate-spin text-blue-primary" />
              Searching Rambhahoo...
            </div>
          )}

          {!loading && !hasSuggestions && (
            <div className="p-4 text-sm text-text-muted text-center">
              No direct matches found for "{query}"
            </div>
          )}

          {/* Localities Category */}
          {suggestions.localities.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5 select-none">
                <MapPin size={10} className="text-blue-primary" /> Localities
              </div>
              <div className="mt-1 px-1.5 space-y-0.5">
                {suggestions.localities.map((loc) => (
                  <button
                    key={loc.slug}
                    onClick={() => handleSelect(`/${loc.slug}`, loc.name)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-card-hover transition-colors group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform select-none">{loc.emoji}</span>
                    <span className="text-sm font-medium text-text-primary group-hover:text-blue-primary transition-colors">{loc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* People Category */}
          {suggestions.users.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5 select-none">
                <User size={10} className="text-purple-500" /> People
              </div>
              <div className="mt-1 px-1.5 space-y-0.5">
                {suggestions.users.map((user) => (
                  <button
                    key={user.username}
                    onClick={() => handleSelect(`/profile/${user.username}`, user.display_name || user.username)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-card-hover transition-colors group"
                  >
                    <Avatar src={user.avatar_url} name={user.display_name || user.username} size="sm" className="shrink-0" />
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-text-primary group-hover:text-blue-primary transition-colors truncate">
                        {user.display_name || user.username}
                      </span>
                      <span className="block text-[11px] text-text-dim truncate">@{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Businesses Category */}
          {suggestions.businesses.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Building2 size={10} className="text-emerald-500" /> Local Businesses
              </div>
              <div className="mt-1 px-1.5 space-y-0.5">
                {suggestions.businesses.map((biz) => (
                  <button
                    key={biz.slug}
                    onClick={() => handleSelect(`/search?q=${encodeURIComponent(biz.name)}`, biz.name)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-card-hover transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500 select-none">
                      <Building2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium text-text-primary group-hover:text-blue-primary transition-colors truncate">
                        {biz.name}
                      </span>
                      <span className="block text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded text-text-dim w-fit mt-0.5">
                        {biz.category}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Category */}
          {suggestions.tags.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1 text-[10px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Tag size={10} className="text-amber-500" /> Tags
              </div>
              <div className="mt-1 px-1.5 space-y-0.5">
                {suggestions.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSelect(`/search?q=${encodeURIComponent('#' + tag)}`, `#${tag}`)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-bg-card-hover transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500 select-none">
                      <Tag size={16} />
                    </div>
                    <span className="text-sm font-semibold text-text-primary group-hover:text-blue-primary transition-colors">
                      #{tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
