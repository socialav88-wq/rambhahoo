'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Flag, CornerDownRight } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import ReactionBar from '@/components/reactions/ReactionBar';
import { timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function CommentItem({ comment, onReply, isReply = false }) {
  const [showOptions, setShowOptions] = useState(false);
  const { user } = useAuthStore();
  
  const {
    id, content, created_at, profiles: author, reactions_summary = {}
  } = comment;

  return (
    <div className={`flex gap-3 group ${isReply ? 'ml-10 mt-3' : 'mt-4'}`}>
      <Link href={`/profile/${author?.username || ''}`} className="shrink-0 pt-1">
        <Avatar src={author?.avatar_url} name={author?.display_name} size={isReply ? "sm" : "md"} />
      </Link>
      
      <div className="flex-1 min-w-0">
        <div className="bg-bg-elevated rounded-2xl rounded-tl-none p-3 border border-border shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/profile/${author?.username || ''}`} className="text-sm font-semibold text-text-primary hover:text-blue-primary transition-colors">
                {author?.display_name || 'Anonymous'}
              </Link>
              <span className="text-xs text-text-dim">{timeAgo(created_at)}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="text-text-dim hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <MoreHorizontal size={14} />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-bg-card border border-border rounded-lg shadow-md z-10 py-1 animate-fade-in">
                  <button className="w-full text-left px-3 py-1.5 text-xs text-accent-red hover:bg-bg-card-hover flex items-center gap-2">
                    <Flag size={12} /> Report
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-1.5 ml-2">
          <ReactionBar reactions={reactions_summary} compact size="sm" />
          
          {!isReply && (
            <button 
              onClick={() => onReply && onReply(author?.username)}
              className="text-xs font-medium text-text-dim hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <CornerDownRight size={12} />
              Reply
            </button>
          )}
        </div>
        
        {/* Render nested replies if any */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 relative">
            <div className="absolute left-[-26px] top-0 bottom-6 w-px bg-border-light" />
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
