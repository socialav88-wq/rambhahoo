'use client';

import DiscussionCard from './DiscussionCard';
import ImageCard from './ImageCard';
import PollCard from './PollCard';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PostCard({ post }) {
  if (!post) return null;

  let content;
  switch (post.post_type) {
    case 'image':
      content = <ImageCard post={post} />;
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

  return <div className="mb-4">{content}</div>;
}
