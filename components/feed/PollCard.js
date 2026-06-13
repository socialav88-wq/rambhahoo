'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import PollVoter from '@/components/post/PollVoter';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';

export default function PollCard({ post }) {
  const { title, content, slug, tags = [], poll_options = [], id } = post;

  return (
    <article className="glass-card hover-card rounded-3xl p-5 animate-fade-in relative">
      <PostHeader post={post} />

      {/* Content */}
      <Link href={`/post/${slug}`} className="block group mb-4 mt-2">
        <h2 className="text-base font-semibold text-text-primary group-hover:text-blue-primary transition-colors leading-snug break-words">
          {title}
        </h2>
        {content && (
          <p className="text-sm text-text-muted line-clamp-2 leading-relaxed mt-1">
            {content}
          </p>
        )}
      </Link>

      {/* Poll Options */}
      <div className="mb-4 bg-bg-elevated/30 p-4 rounded-2xl border border-border/50">
        <PollVoter postId={id} options={poll_options} initialVotedOptionId={post.user_voted_option_id} />
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

      <PostFooter post={post} />
    </article>
  );
}
