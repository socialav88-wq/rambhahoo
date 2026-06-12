import { create } from 'zustand';

export const useFeedStore = create((set) => ({
  posts: [],
  filter: 'hot',
  locality: null,
  hasMore: true,
  page: 0,
  
  setPosts: (posts) => set({ posts }),
  addPosts: (newPosts) => set((state) => ({ 
    posts: [...state.posts, ...newPosts],
    page: state.page + 1,
  })),
  setFilter: (filter) => set({ filter, posts: [], page: 0, hasMore: true }),
  setLocality: (locality) => set({ locality, posts: [], page: 0, hasMore: true }),
  setHasMore: (hasMore) => set({ hasMore }),
  
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map(p => p.id === postId ? { ...p, ...updates } : p),
  })),
  
  reset: () => set({ posts: [], filter: 'hot', locality: null, hasMore: true, page: 0 }),
}));
