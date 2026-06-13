import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleFollow } from '@/app/actions/profile';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function useFollowing() {
  const [following, setFollowing] = useState({});
  const { user } = useAuthStore();

  // Load from backend on mount
  useEffect(() => {
    async function fetchFollowing() {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', user.id);
        
      if (!error && data) {
        const followingMap = {};
        data.forEach(row => { followingMap[row.following_id] = true; });
        setFollowing(followingMap);
      }
    }
    fetchFollowing();
  }, [user]);

  const handleToggleFollow = async (userId, userName) => {
    if (!user) {
      toast.error('Please login to follow others');
      return;
    }

    if (user.id === userId) return;

    // Optimistic UI Update
    const isCurrentlyFollowing = !!following[userId];
    setFollowing(prev => ({
      ...prev,
      [userId]: !isCurrentlyFollowing
    }));

    // Server Action
    const res = await toggleFollow(userId);
    if (res?.error) {
      // Revert on error
      setFollowing(prev => ({
        ...prev,
        [userId]: isCurrentlyFollowing
      }));
      toast.error(res.error);
    } else {
      if (res.action === 'followed') {
        toast.success(`Added ${userName} to your Circle!`);
      } else {
        toast.success(`Removed ${userName} from your Circle`);
      }
    }
  };

  const isFollowingUser = (userId) => !!following[userId];

  return { following, toggleFollow: handleToggleFollow, isFollowingUser };
}
