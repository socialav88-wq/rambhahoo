'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import ReactionBar from '@/components/reactions/ReactionBar';
import { REACTIONS } from '@/lib/constants';
import { toggleReaction } from '@/app/actions/interactions';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function PostFooter({ post }) {
  const { user } = useAuthStore();
  const [showPicker, setShowPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  
  // Local optimistic state for reactions
  const [localReactions, setLocalReactions] = useState(post.reactions_summary || {});
  // We can't easily track user's own reactions without it being passed down,
  // but for the feed, optimistic counts are fine.

  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowPicker(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPicker(false);
  };

  const handleReact = async (emoji) => {
    if (!user) {
      toast.error('Please login to react');
      return;
    }
    setShowPicker(false);
    setIsReacting(true);
    
    // Optimistic update
    const currentCount = localReactions[emoji] || 0;
    setLocalReactions({
      ...localReactions,
      [emoji]: currentCount + 1
    });

    const res = await toggleReaction(post.id, null, emoji);
    if (res?.error) {
      // Revert if error
      setLocalReactions({
        ...localReactions,
        [emoji]: currentCount
      });
      toast.error('Failed to react');
    } else if (res?.action === 'removed') {
      // It was a toggle-off
      setLocalReactions({
        ...localReactions,
        [emoji]: Math.max(0, currentCount - 1)
      });
    }
    setIsReacting(false);
  };

  const handleShare = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: `${window.location.origin}/post/${post.slug}`,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.slug}`);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2 relative" onMouseLeave={handleMouseLeave}>
        <div onMouseEnter={handleMouseEnter} className="relative z-10">
           <button 
             onClick={(e) => { e.preventDefault(); handleReact('👍'); }}
             disabled={isReacting}
             className="flex items-center gap-1.5 p-2 text-text-dim hover:bg-bg-elevated hover:text-blue-primary rounded-full transition-all active:scale-95"
           >
             <ThumbsUp size={18} />
             <span className="text-xs font-medium">Like</span>
           </button>
        </div>

        {/* Reaction picker popover */}
        {showPicker && (
          <div 
            className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-bg-card border border-border rounded-xl shadow-md z-20 animate-bounce-in"
            onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          >
             {REACTIONS.map(({ emoji, label }) => (
               <button
                 key={emoji}
                 onClick={(e) => { e.preventDefault(); handleReact(emoji); }}
                 title={label}
                 className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-bg-card-hover"
               >
                 {emoji}
               </button>
             ))}
          </div>
        )}

        {/* Reaction Bar for existing reactions */}
        <div className="ml-2 hidden xs:block">
          <ReactionBar reactions={localReactions} compact size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Link href={`/post/${post.slug}`} className="flex items-center gap-1.5 p-2 text-text-dim hover:bg-bg-elevated hover:text-blue-primary rounded-full transition-all active:scale-95">
          <MessageSquare size={18} />
          <span className="text-xs font-medium">{formatNumber(post.comment_count || 0)}</span>
        </Link>
        <button 
          onClick={handleShare}
          aria-label="Share post" 
          className="flex items-center gap-1.5 p-2 rounded-full text-text-dim hover:bg-bg-elevated hover:text-accent-green transition-all active:scale-95"
        >
          <Share2 size={18} />
          <span className="text-xs font-medium hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}
