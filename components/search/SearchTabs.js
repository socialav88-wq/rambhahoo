'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/feed/PostCard';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { 
  User, 
  MapPin, 
  FileText, 
  Flame, 
  Building2, 
  Tag, 
  Sparkles, 
  TrendingUp, 
  ChevronRight, 
  Star 
} from 'lucide-react';

export default function SearchTabs({ results, query, recommendations }) {
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);

  const { 
    posts = [], 
    users = [], 
    localities = [], 
    businesses = [], 
    tags = [] 
  } = results || {};

  const tabs = [
    { id: 'posts', label: 'Posts', count: posts.length, icon: FileText },
    { id: 'users', label: 'People', count: users.length, icon: User },
    { id: 'localities', label: 'Localities', count: localities.length, icon: MapPin },
    { id: 'businesses', label: 'Businesses', count: businesses.length, icon: Building2 },
    { id: 'tags', label: 'Tags', count: tags.length, icon: Tag },
  ];

  const totalResultsCount = posts.length + users.length + localities.length + businesses.length + tags.length;

  // Render recommendation grid if there are no search results
  if (totalResultsCount === 0) {
    return (
      <div className="space-y-10">
        {/* Sleek Empty State Alert */}
        <div className="flex flex-col items-center justify-center p-8 bg-bg-card rounded-2xl border border-border border-dashed text-center max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-bg-elevated rounded-2xl flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-blue-primary" />
          </div>
          {query ? (
            <>
              <h3 className="font-semibold text-text-primary text-base">No matches found for "{query}"</h3>
              <p className="text-xs text-text-dim mt-1.5 max-w-sm">
                We couldn't find any direct results. Try checking your spelling, using more general keywords, or explore active trends below.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-text-primary text-base">Search & Discover Rambhahoo</h3>
              <p className="text-xs text-text-dim mt-1.5 max-w-sm">
                Find local discussions, trending neighborhoods, active tags, and the best cafes or gyms around Hyderabad.
              </p>
            </>
          )}
        </div>

        {/* Unified Explorer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          {/* Left / Secondary Column: Localities & Tags */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active Localities */}
            {recommendations?.localities && recommendations.localities.length > 0 && (
              <div className="bg-bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-blue-primary" />
                  <h3 className="font-bold text-sm text-text-primary font-[family-name:var(--font-poppins)] uppercase tracking-wider">
                    Popular Localities
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recommendations.localities.slice(0, 6).map((locality) => (
                    <Link 
                      key={locality.slug} 
                      href={`/${locality.slug}`}
                      className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-border hover:border-blue-primary/40 hover:bg-bg-elevated/40 hover:shadow-sm transition-all text-center group"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">
                        {locality.emoji}
                      </span>
                      <span className="text-xs font-semibold text-text-primary truncate w-full">
                        {locality.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tags */}
            {recommendations?.tags && recommendations.tags.length > 0 && (
              <div className="bg-bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-accent-amber" />
                  <h3 className="font-bold text-sm text-text-primary font-[family-name:var(--font-poppins)] uppercase tracking-wider">
                    Trending Tags
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {recommendations.tags.slice(0, 6).map((t, index) => (
                    <Link
                      key={t.tag}
                      href={`/search?q=${encodeURIComponent('#' + t.tag)}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-bg-card-hover transition-colors -mx-1"
                    >
                      <span className="text-xs font-bold text-text-primary hover:text-blue-primary transition-colors">
                        #{t.tag}
                      </span>
                      <Badge variant={index < 2 ? 'trending' : 'default'} className="text-[9px] uppercase tracking-wider py-0.5 px-2">
                        {t.label || 'Trending'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right / Main Column: Hot Decayed Trending Posts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Flame size={20} className="text-accent-red" />
              <h3 className="font-bold text-base text-text-primary font-[family-name:var(--font-poppins)]">
                Hot Discussions Right Now
              </h3>
            </div>
            {recommendations?.posts && recommendations.posts.length > 0 ? (
              <div className="space-y-4">
                {recommendations.posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-text-muted bg-bg-card border border-border rounded-xl">
                No active discussions found. Start the conversation!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs list */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-semibold text-xs uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? 'border-blue-primary text-blue-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            <span className={`ml-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-primary/10 text-blue-primary' 
                : 'bg-bg-elevated text-text-dim'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tabs content panels */}
      <div className="space-y-4">
        
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState message={`No posts found matching "${query}"`} />
          )
        )}

        {/* People Tab */}
        {activeTab === 'users' && (
          users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {users.map(user => (
                <Link
                  key={user.username}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-bg-card border border-border hover:border-blue-primary/50 transition-all shadow-sm hover:shadow-md duration-300 group"
                >
                  <Avatar src={user.avatar_url} name={user.display_name || user.username} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary group-hover:text-blue-primary transition-colors truncate">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-xs text-text-dim">@{user.username}</p>
                    {user.bio && <p className="text-xs text-text-muted mt-1.5 line-clamp-1">{user.bio}</p>}
                  </div>
                  <ChevronRight size={16} className="text-text-dim group-hover:text-blue-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message={`No people found matching "${query}"`} />
          )
        )}

        {/* Localities Tab */}
        {activeTab === 'localities' && (
          localities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
              {localities.map(loc => (
                <Link
                  key={loc.slug}
                  href={`/${loc.slug}`}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl bg-bg-card border border-border hover:border-blue-primary/50 text-center transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform select-none">{loc.emoji}</span>
                  <h3 className="font-semibold text-text-primary text-sm group-hover:text-blue-primary transition-colors">{loc.name}</h3>
                  {loc.tagline && <p className="text-xs text-text-dim mt-1 line-clamp-1">{loc.tagline}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState message={`No localities found matching "${query}"`} />
          )
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          businesses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
              {businesses.map(biz => (
                <div
                  key={biz.slug}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-bg-card border border-border hover:border-blue-primary/50 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {biz.image_url && (
                    <div className="w-full sm:w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-bg-elevated relative select-none">
                      <img src={biz.image_url} alt={biz.name} className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm text-[9px] font-bold text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {biz.category}
                      </div>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-text-primary text-base truncate">{biz.name}</h3>
                        {biz.rating && (
                          <div className="flex items-center gap-0.5 bg-amber-500/10 text-accent-amber px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0">
                            <Star size={10} className="fill-current" />
                            <span>{Number(biz.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-text-dim mt-1.5 line-clamp-2 leading-relaxed">{biz.description}</p>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {biz.localities ? (
                        <Link href={`/${biz.localities.slug}`} className="flex items-center gap-1 text-blue-primary hover:underline font-semibold">
                          <span>{biz.localities.emoji}</span>
                          <span>{biz.localities.name}</span>
                        </Link>
                      ) : (
                        <span className="text-text-muted">Hyderabad</span>
                      )}
                      
                      {biz.tags && biz.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {biz.tags.slice(0, 3).map(t => (
                            <Link
                              key={t}
                              href={`/search?q=${encodeURIComponent(t)}`}
                              className="text-[10px] bg-bg-elevated hover:bg-bg-elevated-hover text-text-dim hover:text-text-primary px-2 py-0.5 rounded-md font-medium transition-colors"
                            >
                              #{t}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message={`No local businesses found matching "${query}"`} />
          )
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          tags.length > 0 ? (
            <div className="space-y-6 animate-fade-in">
              {/* Tag Pills */}
              <div className="bg-bg-card border border-border rounded-2xl p-4 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-3">Filter by Match</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedTagFilter(null)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-all border font-medium ${
                      !selectedTagFilter
                        ? 'bg-blue-primary border-blue-primary text-white shadow-sm'
                        : 'bg-bg-elevated hover:bg-bg-elevated-hover border-border text-text-muted hover:text-text-primary'
                    }`}
                  >
                    All Tags ({tags.reduce((sum, t) => sum + t.count, 0)})
                  </button>
                  {tags.map(t => (
                    <button
                      key={t.tag}
                      onClick={() => setSelectedTagFilter(t.tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl transition-all border flex items-center gap-1.5 font-medium ${
                        selectedTagFilter === t.tag
                          ? 'bg-blue-primary border-blue-primary text-white shadow-sm'
                          : 'bg-bg-elevated hover:bg-bg-elevated-hover border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span>#{t.tag}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        selectedTagFilter === t.tag ? 'bg-white/20 text-white' : 'bg-bg-card text-text-dim'
                      }`}>
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Posts */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {selectedTagFilter ? `Posts tagged #${selectedTagFilter}` : 'All posts matching tags'}
                  </h3>
                </div>
                {(() => {
                  const filteredPosts = posts.filter(post => 
                    selectedTagFilter 
                      ? (post.tags || []).some(t => t.toLowerCase() === selectedTagFilter.toLowerCase())
                      : (post.tags && post.tags.length > 0)
                  );

                  return filteredPosts.length > 0 ? (
                    filteredPosts.map(post => <PostCard key={post.id} post={post} />)
                  ) : (
                    <div className="text-center py-12 text-text-muted text-sm bg-bg-card rounded-2xl border border-border border-dashed">
                      No posts found with this tag in your search results.
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <EmptyState message={`No tags found matching "${query}"`} />
          )
        )}

      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-2xl border border-border border-dashed text-center">
      <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center mb-4">
        <Flame size={28} className="text-text-dim" />
      </div>
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}
