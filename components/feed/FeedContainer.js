'use client';

import { useEffect, useState } from 'react';
import PostCard from './PostCard';
import FeedFilters from './FeedFilters';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { Flame } from 'lucide-react';
import { fetchFeeds } from '@/app/actions/posts';


export default function FeedContainer({ initialFilter = 'new', localitySlug = null, initialPosts = null }) {
  const [filter, setFilter] = useState(initialFilter);
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch from Supabase
  useEffect(() => {
    let mounted = true;
    
    // Skip initial fetch if we already have initialPosts and filter hasn't changed
    if (initialPosts && filter === initialFilter && !userLocation && filter !== 'nearby') {
      return;
    }
    
    setLoading(true);
    
    async function loadData(lat = null, lng = null) {
      try {
        const data = await fetchFeeds(filter, localitySlug, lat, lng);
        if (mounted) setPosts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    if (filter === 'nearby') {
      if (userLocation) {
        loadData(userLocation.lat, userLocation.lng);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if (mounted) setUserLocation(loc);
            loadData(loc.lat, loc.lng);
          },
          (err) => {
            console.error("Failed to get location for nearby feed", err);
            loadData(); // fallback
          },
          { timeout: 10000, maximumAge: 60000 }
        );
      } else {
        loadData();
      }
    } else {
      loadData();
    }
    
    return () => { mounted = false; };
  }, [filter, localitySlug, userLocation, initialFilter, initialPosts]);

  return (
    <div className="space-y-4">
      {/* Feed Filters */}
      <div className="sticky top-[56px] lg:top-[72px] z-30 pt-2 pb-4 bg-bg-primary/95 backdrop-blur-md">
        <FeedFilters active={filter} onChange={setFilter} />
      </div>

      {/* Empty State / Loading / Posts */}
      {loading ? (
        <FeedSkeleton count={3} />
      ) : posts.length === 0 ? (
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
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          
          <div className="py-6 flex justify-center">
            <Button variant="outline" className="w-full sm:w-auto">
              Load More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
