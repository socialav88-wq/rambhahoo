import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      compact: false,
      animations: true,
      fontSize: 'medium', // 'small' | 'medium' | 'large'
      searchRadius: '5', // '1' | '5' | '10' | 'city'
      dataSaver: false,
      imageQuality: 'high', // 'high' | 'wifi'
      videoQuality: 'high', // 'high' | 'wifi'

      setTheme: (theme) => set({ theme }),
      setCompact: (compact) => set({ compact }),
      setAnimations: (animations) => set({ animations }),
      setFontSize: (fontSize) => set({ fontSize }),
      setSearchRadius: (searchRadius) => set({ searchRadius }),
      setDataSaver: (dataSaver) => set({ dataSaver }),
      setImageQuality: (imageQuality) => set({ imageQuality }),
      setVideoQuality: (videoQuality) => set({ videoQuality }),
    }),
    {
      name: 'rambhahoo-settings-preferences',
    }
  )
);
