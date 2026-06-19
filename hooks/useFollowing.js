import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCircleStore } from '@/store/circleStore';

export function useFollowing() {
  const { user } = useAuthStore();
  const { following, fetchFollowing, toggleFollow, reset } = useCircleStore();

  // Load from backend on mount/user change
  useEffect(() => {
    if (user?.id) {
      fetchFollowing(user.id);
    } else {
      reset();
    }
  }, [user?.id, fetchFollowing, reset]);

  const isFollowingUser = (userId) => !!following[userId];

  return { following, toggleFollow, isFollowingUser };
}

