'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdviceFeedCard, { ADVICE_CATEGORIES_MAP } from './AdviceFeedCard';
import { fetchAdviceFeed } from '@/app/actions/advice';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { HelpCircle, ChevronRight, MessageSquareHeart } from 'lucide-react';
import { LOCALITIES } from '@/lib/constants';

export default function AdviceFeedContainer({ initialPosts, user }) {
  const [filter, setFilter] = useState('new');
  const [category, setCategory] = useState(null);
  const [locality, setLocality] = useState('');
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts ? initialPosts.length >= 10 : true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);

  const categories = Object.entries(ADVICE_CATEGORIES_MAP).map(([key, val]) => ({
    value: key,
    ...val
  }));

  // Fetch initial page on state changes
  useEffect(() => {
    let mounted = true;
    
    // Skip first load if we have initialPosts and no filters changed
    if (page === 1 && filter === 'new' && !category && !locality && posts.length > 0) {
      return;
    }

    setLoading(true);
    setPage(1);
    setHasMore(true);

    async function loadData() {
      try {
        const data = await fetchAdviceFeed(filter, category, locality || null, 1, 10);
        if (mounted) {
          setPosts(data || []);
          setHasMore((data || []).length >= 10);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [filter, category, locality]);

  // Load more pagination
  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    try {
      const data = await fetchAdviceFeed(filter, category, locality || null, nextPage, 10);
      setPosts((prev) => [...prev, ...data]);
      setPage(nextPage);
      if (data.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { rootMargin: '200px' });

    const currentTarget = loadMoreRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, filter, category, locality]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar: Categories Selection (Desktop) */}
      <aside className="hidden lg:block w-64 shrink-0 space-y-4">
        <div className="bg-bg-card rounded-2xl border border-border p-4 shadow-sm space-y-1">
          <div className="px-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim">Categories</h3>
          </div>

          <button
            onClick={() => setCategory(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              category === null
                ? 'bg-blue-primary/10 text-blue-primary'
                : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
            }`}
          >
            <span>🌐</span>
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                category === cat.value
                  ? 'bg-blue-primary/10 text-blue-primary'
                  : 'text-text-muted hover:bg-bg-card-hover hover:text-text-primary'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Feed Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Mobile: Horizontal Categories swipe */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          <button
            onClick={() => setCategory(null)}
            className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              category === null
                ? 'bg-blue-primary border-blue-primary text-white shadow-sm'
                : 'bg-bg-card border-border text-text-muted hover:text-text-primary'
            }`}
          >
            🌐 All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                category === cat.value
                  ? 'bg-blue-primary border-blue-primary text-white shadow-sm'
                  : 'bg-bg-card border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {cat.emoji} {cat.label.replace(' Advice', '').replace(' Problems', '')}
            </button>
          ))}
        </div>

        {/* Dashboard Actions and Filters */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Tabs */}
          <div className="flex bg-bg-elevated p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilter('new')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'new'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setFilter('trending')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'trending'
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Trending
            </button>
            {user && (
              <button
                onClick={() => setFilter('my_questions')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === 'my_questions'
                    ? 'bg-white text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                My Advice
              </button>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto items-center">
            {/* Locality Selector */}
            <select
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className="bg-bg-elevated border border-border rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-blue-primary focus:ring-1 focus:ring-blue-primary/30 flex-1 sm:flex-none"
            >
              <option value="">All Hyderabad</option>
              {LOCALITIES.map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.emoji} {loc.name}
                </option>
              ))}
            </select>

            {/* Ask Advice CTA */}
            <Link href="/advice/create" className="flex-1 sm:flex-none">
              <Button size="sm" className="w-full rounded-full font-bold flex items-center justify-center gap-1">
                <HelpCircle size={14} />
                <span>Ask Advice</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Empty States / Loading / Feed List */}
        {loading ? (
          <FeedSkeleton count={3} />
        ) : posts.length === 0 ? (
          <div className="bg-bg-card rounded-2xl border border-dashed border-border p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquareHeart size={32} className="text-text-dim" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No advice questions found</h3>
            <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
              Be the first to ask the community for guidance, career help, or local recommendations.
            </p>
            <Link href="/advice/create">
              <Button variant="primary" className="rounded-full px-6 font-bold">Ask for Advice</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <AdviceFeedCard key={post.id} post={post} />
            ))}

            {/* Pagination Loading indicator */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-6 flex justify-center">
                <FeedSkeleton count={1} />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="py-10 text-center opacity-80">
                <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-blue-50/50 border border-blue-100 text-blue-600 mb-2">
                  <Check size={18} />
                </div>
                <h4 className="text-text-primary font-bold text-sm">All caught up!</h4>
                <p className="text-text-dim text-xs mt-0.5">You have read all guidance requests in this section.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
