'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Share2, Bookmark, ImageIcon } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/reactions/ReactionBar';
import { timeAgo, formatNumber } from '@/lib/utils';
import { useSavedPosts } from '@/hooks/useSavedPosts';

export default function ImageCard({ post }) {
  const { isSaved, toggleSave } = useSavedPosts();
  const {
    id, title, image_url, slug, tags = [],
    comment_count = 0, reaction_count = 0,
    created_at, is_trending,
    profiles: author,
    localities: locality,
    reactions_summary = {}
  } = post;

  return (
    <article className="bg-bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden animate-fade-in">
      {/* Image */}
      <Link href={`/post/${slug}`} className="block relative">
        {image_url ? (
          <div className="relative w-full aspect-[4/5] bg-bg-elevated">
            <Image
              src={image_url}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/5] bg-bg-elevated flex items-center justify-center">
            <ImageIcon size={48} className="text-text-dim" />
          </div>
        )}
        {is_trending && (
          <div className="absolute top-3 right-3">
            <Badge variant="trending">🔥 Trending</Badge>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/profile/${author?.username || ''}`}>
            <Avatar src={author?.avatar_url} name={author?.display_name} size="xs" />
          </Link>
          <Link href={`/profile/${author?.username || ''}`} className="text-xs font-medium text-text-muted hover:text-blue-primary transition-colors">
            {author?.display_name}
          </Link>
          <span className="text-xs text-text-dim">· {timeAgo(created_at)}</span>
          {locality && (
            <Link href={`/${locality.slug}`}>
              <Badge variant="primary" className="text-[10px]">
                {locality.emoji} {locality.name}
              </Badge>
            </Link>
          )}
        </div>

        {/* Title */}
        <Link href={`/post/${slug}`}>
          <h3 className="text-sm font-semibold text-text-primary hover:text-blue-primary transition-colors leading-snug">
            {title}
          </h3>
        </Link>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <ReactionBar reactions={reactions_summary} compact size="sm" />
          <div className="flex items-center gap-3">
            <Link href={`/post/${slug}`} className="flex items-center gap-1 text-text-dim hover:text-blue-primary transition-colors">
              <MessageSquare size={14} />
              <span className="text-xs">{formatNumber(comment_count)}</span>
            </Link>
            <button 
              onClick={(e) => { e.preventDefault(); toggleSave(id); }}
              className={`transition-colors ${isSaved(id) ? 'text-accent-amber' : 'text-text-dim hover:text-accent-amber'}`}
            >
              <Bookmark size={14} fill={isSaved(id) ? 'currentColor' : 'none'} />
            </button>
            <button className="text-text-dim hover:text-accent-green transition-colors"><Share2 size={14} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}
