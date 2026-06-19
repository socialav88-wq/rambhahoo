import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { toggleFollow as toggleFollowAction } from '@/app/actions/profile';
import toast from 'react-hot-toast';

export const useCircleStore = create((set, get) => ({
  following: {},
  isLoaded: false,
  isLoading: false,

  fetchFollowing: async (userId) => {
    if (!userId || get().isLoaded || get().isLoading) return;
    set({ isLoading: true });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
        
      if (!error && data) {
        const followingMap = {};
        data.forEach(row => { followingMap[row.following_id] = true; });
        set({ following: followingMap, isLoaded: true });
      }
    } catch (err) {
      console.error('Error fetching following list:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFollow: async (userId, userName) => {
    const following = get().following;
    const isCurrentlyFollowing = !!following[userId];

    // Optimistic update
    set({
      following: {
        ...following,
        [userId]: !isCurrentlyFollowing
      }
    });

    const res = await toggleFollowAction(userId);
    if (res?.error) {
      // Revert on failure
      set({
        following: {
          ...get().following,
          [userId]: isCurrentlyFollowing
        }
      });
      toast.error(res.error);
      return { error: res.error };
    } else {
      if (res.action === 'followed') {
        toast.success(`Added ${userName} to your Circle!`);
      } else {
        toast.success(`Removed ${userName} from your Circle`);
      }
      return { action: res.action };
    }
  },

  isFollowingUser: (userId) => {
    return !!get().following[userId];
  },

  reset: () => {
    set({ following: {}, isLoaded: false, isLoading: false });
  }
}));
