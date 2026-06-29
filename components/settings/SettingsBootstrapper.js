'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsBootstrapper() {
  const { theme, fontSize, animations, compact } = useSettingsStore();

  useEffect(() => {
    // 1. Sync theme class
    const root = document.documentElement;
    const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'dark' || (theme === 'system' && isDarkSystem)) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // 2. Sync Font Size class
    const root = document.documentElement;
    root.classList.remove('font-sm', 'font-md', 'font-lg');
    
    if (fontSize === 'small') {
      root.classList.add('font-sm');
    } else if (fontSize === 'large') {
      root.classList.add('font-lg');
    } else {
      root.classList.add('font-md');
    }
  }, [fontSize]);

  useEffect(() => {
    // 3. Sync Animations class
    const body = document.body;
    if (!animations) {
      body.classList.add('no-animations');
    } else {
      body.classList.remove('no-animations');
    }
  }, [animations]);

  useEffect(() => {
    // 4. Sync Compact mode class
    const body = document.body;
    if (compact) {
      body.classList.add('compact-mode');
    } else {
      body.classList.remove('compact-mode');
    }
  }, [compact]);

  return null;
}
