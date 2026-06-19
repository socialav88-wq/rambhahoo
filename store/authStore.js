import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  authError: null,
  
  setUser: (user) => set({ user, isLoading: false }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthError: (authError) => set({ authError }),
  
  signOut: () => set({ user: null, profile: null, isLoading: false, authError: null }),
}));
