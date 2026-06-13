'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';

export default function DiscussionCard({ post }) {
  const { title, content, slug, tags = [] } = post;

  return (
    <article className="glass-card hover-card rounded-3xl p-5 animate-fade-in relative">
      <PostHeader post={post} />

      {/* Content */}
      <Link href={`/post/${slug}`} className="block group mt-2">
        <h2 className="text-base font-semibold text-text-primary group-hover:text-blue-primary transition-colors leading-snug mb-1 break-words">
          {title}
        </h2>
        {content && (
          <p className="text-sm text-text-muted line-clamp-3 leading-relaxed break-words">
            {content}
          </p>
        )}
      </Link>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {tags.map((tag) => (
            <Link key={tag} href={`/search?q=${tag}`}>
              <Badge variant="secondary" className="text-[10px] hover:opacity-80 cursor-pointer">
                #{tag}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <PostFooter post={post} />
    </article>
  );
}
