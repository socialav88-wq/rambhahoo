'use client';

import { useEffect, useState, useRef } from 'react';
import PostCard from './PostCard';
import FeedFilters from './FeedFilters';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { Flame } from 'lucide-react';
import { fetchFeeds } from '@/app/actions/posts';
import { useFeedStore } from '@/store/feedStore';

export default function FeedContainer({ initialFilter = 'new', localitySlug = null, initialPosts = null, category = null }) {
  const [filter, setFilter] = useState(initialFilter);
  const posts = useFeedStore((s) => s.posts);
  const setPosts = useFeedStore((s) => s.setPosts);
  const [loading, setLoading] = useState(!initialPosts);
  const [userLocation, setUserLocation] = useState(null);
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts ? initialPosts.length >= 10 : true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreRef = useRef(null);
  const { optimisticPosts } = useFeedStore();
  const allPosts = [...optimisticPosts, ...posts];

  // Sync initial posts on mount if store is empty
  useEffect(() => {
    if (initialPosts && posts.length === 0) {
      setPosts(initialPosts);
    }
  }, [initialPosts, setPosts]);

  // Sync posts state when initialPosts changes (e.g. on server revalidation)
  useEffect(() => {
    if (initialPosts && filter === initialFilter) {
      setPosts(initialPosts);
      setPage(1);
      setHasMore(initialPosts.length >= 10);
    }
  }, [initialPosts, filter, initialFilter, setPosts]);

  // Reset and fetch page 1 when filter, locality, or location changes
  useEffect(() => {
    let mounted = true;
    
    // Skip fetch if we already have initialPosts and matches filter
    if (initialPosts && filter === initialFilter && !userLocation && page === 1 && posts.length > 0) {
      return;
    }
    
    setLoading(true);
    setPage(1);
    setHasMore(true);
    
    async function loadInitialData(lat = null, lng = null) {
      try {
        const data = await fetchFeeds(filter, localitySlug, lat, lng, 5000, 1, 10, category);
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
    
    if (filter === 'nearby') {
      if (userLocation) {
        loadInitialData(userLocation.lat, userLocation.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (mounted) setUserLocation(loc);
            loadInitialData(loc.lat, loc.lng);
          },
          (err) => {
            console.error("Failed to get location for nearby feed", err);
            loadInitialData(); // fallback
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      } else {
        loadInitialData();
      }
    } else {
      loadInitialData();
    }
    
    return () => { mounted = false; };
  }, [filter, localitySlug, userLocation, category]);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextPage = page + 1;
    try {
      const lat = userLocation?.lat || null;
      const lng = userLocation?.lng || null;
      const data = await fetchFeeds(filter, localitySlug, lat, lng, 5000, nextPage, 10, category);
      setPosts([...useFeedStore.getState().posts, ...data]);
      setPage(nextPage);
      if (data.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting) {
        loadMore();
      }
    }, {
      rootMargin: '200px',
    });

    const currentTarget = loadMoreRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, filter, userLocation, category]);

  return (
    <div className="space-y-4">
      {/* Feed Filters */}
      <div className="sticky top-[56px] lg:top-[72px] z-30 pt-2 pb-4 bg-bg-primary/95 backdrop-blur-md">
        <FeedFilters active={filter} onChange={setFilter} />
      </div>

      {/* Empty State / Loading / Posts */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : allPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-xl border border-border border-dashed text-center shadow-sm">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
            <Flame size={32} className="text-text-dim" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No posts found</h3>
          <p className="text-text-muted text-sm mb-6 max-w-sm">
            Be the first to start a conversation in this area. Share news, ask a question, or post a picture!
          </p>
          <Button variant="primary">Create Post</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {allPosts.map((post, index) => (
            <PostCard key={post.id} post={post} priority={index === 0} />
          ))}

          {/* IntersectionObserver Sentinel */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
              <FeedSkeleton count={1} />
            </div>
          )}

          {!hasMore && allPosts.length > 0 && (
            <div className="py-10 flex flex-col items-center justify-center text-center opacity-90">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 shadow-sm border border-indigo-100">
                <Flame size={20} className="text-[#4F46E5]" />
              </div>
              <h4 className="text-[#4F46E5] font-bold text-lg font-[family-name:var(--font-poppins)] tracking-wide">
                That's it Boss!
              </h4>
              <p className="text-gray-500 text-sm mt-1 font-medium">
                You've caught up on all the local discussions.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
