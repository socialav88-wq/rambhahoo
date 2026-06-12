import { useState, useEffect } from 'react';

export function useSavedPosts() {
  const [savedPosts, setSavedPosts] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rambhahoo_saved_posts');
      if (saved) {
        setSavedPosts(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load saved posts', e);
    }
  }, []);

  const toggleSave = (postId) => {
    const newSaved = { ...savedPosts };
    if (newSaved[postId]) {
      delete newSaved[postId];
    } else {
      newSaved[postId] = true;
    }
    setSavedPosts(newSaved);
    try {
      localStorage.setItem('rambhahoo_saved_posts', JSON.stringify(newSaved));
    } catch (e) {
      console.error('Failed to save post', e);
    }
  };

  const isSaved = (postId) => !!savedPosts[postId];

  return { savedPosts, toggleSave, isSaved };
}
