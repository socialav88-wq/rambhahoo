'use client';

import DiscussionCard from './DiscussionCard';
import ImageCard from './ImageCard';
import PollCard from './PollCard';
import { Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { deletePost } from '@/app/actions/posts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PostCard({ post, priority = false }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!post) return null;

  let content;
  switch (post.post_type) {
    case 'image':
      content = <ImageCard post={post} priority={priority} />;
      break;
    case 'poll':
      content = <PollCard post={post} />;
      break;
    case 'discussion':
    default:
      content = <DiscussionCard post={post} />;
      break;
  }

  if (post.isOptimistic) {
    return (
      <div className="relative mb-4">
        <div className="pointer-events-none opacity-80">
          {content}
        </div>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md">
          {post.hasError ? (
            <><AlertCircle size={14} className="text-accent-red" /> Failed</>
          ) : (
            <><Loader2 size={14} className="animate-spin" /> Posting...</>
          )}
        </div>
      </div>
    );
  }

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
      window.location.reload(); // Hard reload to clear client state
    }
  };

  return (
    <div className="relative mb-4 group">
      {content}
      
      {/* Global Delete Button Overlay on Feed */}
      {user?.id === post.user_id && !post.isOptimistic && (
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-4 right-4 z-10 p-2 bg-bg-card/80 backdrop-blur-sm border border-border rounded-lg text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Delete Post"
        >
          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      )}
    </div>
  );
}
