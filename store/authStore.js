import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  
  setUser: (user) => set({ user, isLoading: false }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  
  signOut: () => set({ user: null, profile: null, isLoading: false }),
}));
