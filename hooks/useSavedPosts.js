import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toggleSavePost } from '@/app/actions/interactions';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function useSavedPosts() {
  const [savedPosts, setSavedPosts] = useState({});
  const { user } = useAuthStore();

  // Load from backend on mount
  useEffect(() => {
    async function fetchSavedPosts() {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id);
        
      if (!error && data) {
        const savedMap = {};
        data.forEach(row => { savedMap[row.post_id] = true; });
        setSavedPosts(savedMap);
      }
    }
    fetchSavedPosts();
  }, [user]);

  const toggleSave = async (postId) => {
    if (!user) {
      toast.error('Please login to save posts');
      return;
    }

    // Optimistic UI Update
    const isCurrentlySaved = !!savedPosts[postId];
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !isCurrentlySaved
    }));

    // Server Action
    const res = await toggleSavePost(postId);
    if (res?.error) {
      // Revert on error
      setSavedPosts(prev => ({
        ...prev,
        [postId]: isCurrentlySaved
      }));
      toast.error(res.error);
    } else {
      if (res.action === 'saved') {
        toast.success('Post saved');
      }
    }
  };

  const isSaved = (postId) => !!savedPosts[postId];

  return { savedPosts, toggleSave, isSaved };
}
