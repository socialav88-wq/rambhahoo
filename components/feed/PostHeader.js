'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { timeAgo } from '@/lib/utils';
import PostMenu from './PostMenu';
import { useAuthStore } from '@/store/authStore';
import { useFollowing } from '@/hooks/useFollowing';

export default function PostHeader({ post }) {
  const { user } = useAuthStore();
  const { toggleFollow, isFollowingUser } = useFollowing();
  
  const {
    created_at, is_trending,
    profiles: author,
    localities: locality,
  } = post;

  const isAuthor = user?.id === author?.id;
  const isFollowing = isFollowingUser(author?.id);

  const handleToggleCircle = (e) => {
    e.preventDefault();
    toggleFollow(author?.id, author?.display_name || author?.username);
  };

  return (
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${author?.username || ''}`}>
          <Avatar src={author?.avatar_url} name={author?.display_name} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${author?.username || ''}`} className="text-sm font-medium text-text-primary hover:text-blue-primary transition-colors">
              {author?.display_name || 'Anonymous'}
            </Link>
            
            {!isAuthor && (
              <button 
                onClick={handleToggleCircle}
                className={`text-xs font-semibold transition-colors flex items-center gap-1 ${isFollowing ? 'text-text-dim hover:text-accent-red' : 'text-blue-primary hover:text-blue-hover'}`}
              >
                <span>•</span> {isFollowing ? 'Following' : 'Add to Circle'}
              </button>
            )}

            <span className="text-xs text-text-dim">@{author?.username}</span>
            
            {locality && (
              <Link href={`/${locality.slug}`}>
                <Badge variant="primary" className="text-[10px]">
                  {locality.emoji} {locality.name}
                </Badge>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-text-dim">{timeAgo(created_at)}</p>
            {is_trending && (
              <Badge variant="trending" className="text-[9px] py-0 px-1.5 h-4">
                🔥 Trending
              </Badge>
            )}
          </div>
        </div>
      </div>

      <PostMenu post={post} />
    </div>
  );
}
