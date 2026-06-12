'use client';

import Link from 'next/link';
import { MessageSquare, Share2, Bookmark, BarChart3 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/reactions/ReactionBar';
import PollVoter from '@/components/post/PollVoter';
import { timeAgo, formatNumber } from '@/lib/utils';
import { useSavedPosts } from '@/hooks/useSavedPosts';

export default function PollCard({ post }) {
  const { isSaved, toggleSave } = useSavedPosts();
  const {
    id, title, content, slug, tags = [],
    comment_count = 0,
    created_at,
    profiles: author,
    localities: locality,
    reactions_summary = {},
    poll_options = []
  } = post;

  return (
    <article className="bg-bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/profile/${author?.username || ''}`}>
          <Avatar src={author?.avatar_url} name={author?.display_name} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${author?.username || ''}`} className="text-sm font-medium text-text-primary hover:text-blue-primary transition-colors">
              {author?.display_name || 'Anonymous'}
            </Link>
            <span className="text-xs text-text-dim">@{author?.username}</span>
            {locality && (
              <Link href={`/${locality.slug}`}>
                <Badge variant="primary" className="text-[10px]">
                  {locality.emoji} {locality.name}
                </Badge>
              </Link>
            )}
          </div>
          <p className="text-xs text-text-dim">{timeAgo(created_at)}</p>
        </div>
        <Badge variant="secondary" className="gap-1 px-2 py-1">
          <BarChart3 size={12} />
          <span>Poll</span>
        </Badge>
      </div>

      {/* Content */}
      <Link href={`/post/${slug}`} className="block group mb-4">
        <h3 className="text-base font-semibold text-text-primary group-hover:text-blue-primary transition-colors leading-snug mb-1">
          {title}
        </h3>
        {content && (
          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mb-3">
            {content}
          </p>
        )}
      </Link>

      {/* Poll Options — interactive with real Supabase votes */}
      <div className="mb-4">
        <PollVoter postId={id} options={poll_options} compact />
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <Link key={tag} href={`/search?q=${tag}`}>
              <Badge variant="secondary" className="text-[10px] hover:opacity-80 cursor-pointer">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        <ReactionBar reactions={reactions_summary} compact size="sm" />
        <div className="flex items-center gap-3">
          <Link href={`/post/${slug}`} className="flex items-center gap-1 text-text-dim hover:text-blue-primary transition-colors">
            <MessageSquare size={14} />
            <span className="text-xs font-medium">{formatNumber(comment_count)}</span>
          </Link>
          <button 
            onClick={(e) => { e.preventDefault(); toggleSave(id); }}
            className={`transition-colors ${isSaved(id) ? 'text-accent-amber' : 'text-text-dim hover:text-accent-amber'}`}
          >
            <Bookmark size={14} fill={isSaved(id) ? 'currentColor' : 'none'} />
          </button>
          <button className="text-text-dim hover:text-accent-green transition-colors">
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
