'use client';

import DiscussionCard from './DiscussionCard';
import ImageCard from './ImageCard';
import PollCard from './PollCard';
import EventCard from './EventCard';
import { Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { deletePost } from '@/app/actions/posts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PostCard({ post, priority = false }) {
  if (!post) return null;

  let content;
  switch (post.post_type) {
    case 'image':
      content = <ImageCard post={post} priority={priority} />;
      break;
    case 'poll':
      content = <PollCard post={post} />;
      break;
    case 'event':
      content = <EventCard post={post} />;
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

  return (
    <div className="relative mb-4 group">
      {content}
    </div>
  );
}
