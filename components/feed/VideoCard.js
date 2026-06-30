'use client';

import Badge from '@/components/ui/Badge';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';
import VideoPlayer from './VideoPlayer';

export default function VideoCard({ post }) {
  const { title, video_url, video_metadata = {}, tags = [] } = post;

  return (
    <article className="bg-bg-card border border-border hover-card rounded-3xl p-5 animate-fade-in relative">
      <PostHeader post={post} />

      {/* Video Content */}
      <div className="block mt-2">
        <h2 className="text-base font-semibold text-text-primary leading-snug mb-3 break-words">
          {title}
        </h2>
        
        {video_url ? (
          <VideoPlayer src={video_url} metadata={video_metadata} />
        ) : (
          <div className="w-full aspect-[4/3] rounded-2xl bg-bg-elevated flex items-center justify-center border border-border text-text-dim">
            <span className="text-sm font-semibold">Video unavailable</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <PostFooter post={post} />
    </article>
  );
}
