'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Bookmark, Flag, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { deletePost } from '@/app/actions/posts';
import toast from 'react-hot-toast';

export default function PostMenu({ post }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  
  const { user } = useAuthStore();
  const { isSaved, toggleSave } = useSavedPosts();
  
  const isAuthor = user?.id === post.user_id;
  const saved = isSaved(post.id);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    toggleSave(post.id);
    setIsOpen(false);
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to report posts');
      return;
    }
    // We could prompt for a reason here, but for now we send a default
    const res = await import('@/app/actions/interactions').then(m => m.reportPost(post.id));
    if (res?.error) {
      toast.error('Failed to report post');
    } else {
      toast.success('Post reported to moderators');
    }
    setIsOpen(false);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    const res = await deletePost(post.id);
    if (res?.error) {
      toast.error('Failed to delete');
      setIsDeleting(false);
    } else {
      toast.success('Post deleted');
      window.location.reload();
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className="p-1.5 text-text-dim hover:text-text-primary hover:bg-bg-elevated rounded-full transition-colors"
        aria-label="Post options"
      >
        <MoreHorizontal size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-bg-card border border-border rounded-xl shadow-lg z-50 py-1 animate-fade-in origin-top-right">
          <button 
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-blue-primary hover:bg-blue-primary/10 transition-colors"
          >
            <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
            {saved ? 'Unsave Post' : 'Save Post'}
          </button>
          
          <button 
            onClick={handleReport}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <Flag size={16} />
            Report Post
          </button>
          
          {isAuthor && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-accent-red hover:bg-accent-red/10 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete Post'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
