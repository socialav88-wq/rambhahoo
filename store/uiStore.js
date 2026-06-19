import { create } from 'zustand';

export const useUIStore = create((set) => ({
  toasts: [],
  isCreateModalOpen: false,
  isMobileMenuOpen: false,
  unreadNotificationsCount: 0,
  
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), ...toast }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
  
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: count }),
  incrementUnreadNotificationsCount: () => set((state) => ({ unreadNotificationsCount: state.unreadNotificationsCount + 1 })),
}));
