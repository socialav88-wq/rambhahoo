'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar({ initialQuery = '', className = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Rambhahoo..."
        className="w-full bg-bg-card border border-border rounded-2xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/50 shadow-sm transition-all text-base"
      />
      <button 
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-primary hover:bg-blue-hover text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors"
      >
        Search
      </button>
    </form>
  );
}
