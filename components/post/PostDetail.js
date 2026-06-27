'use client';

import Link from 'next/link';
import { ArrowLeft, MessageSquare, Share2, Bookmark, MoreHorizontal, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ReactionBar from '@/components/reactions/ReactionBar';
import CommentSection from '@/components/comments/CommentSection';
import PollVoter from '@/components/post/PollVoter';
import { timeAgo, formatNumber } from '@/lib/utils';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { useAuthStore } from '@/store/authStore';
import { useFeedStore } from '@/store/feedStore';
import { deletePost } from '@/app/actions/posts';

export default function PostDetail({ post }) {
  const router = useRouter();
  const { isSaved, toggleSave } = useSavedPosts();
  const { user } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);

  const { posts, setPosts } = useFeedStore();
  const storePost = posts.find(p => p.id === post?.id) || post;

  useEffect(() => {
    if (post && !posts.some(p => p.id === post.id)) {
      setPosts([post, ...posts]);
    }
  }, [post, posts, setPosts]);

  if (!storePost) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-xl border border-border shadow-sm mt-6">
        <AlertCircle size={48} className="text-text-dim mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Post not found</h2>
        <p className="text-text-muted mb-6">This post may have been deleted or never existed.</p>
        <button 
          onClick={() => router.back()}
          className="text-blue-primary hover:text-blue-hover font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const {
    id, post_type, title, content, image_url, tags = [],
    comment_count = 0, created_at,
    profiles: author,
    localities: locality,
    reactions_summary = {},
    poll_options = []
  } = storePost;

  return (
    <article className="max-w-3xl mx-auto mt-4 sm:mt-8 pb-12 animate-fade-in">
      {/* Mobile Back Button */}
      <button 
        onClick={() => router.back()}
        className="md:hidden flex items-center gap-2 text-text-dim hover:text-text-primary mb-4 p-2 -ml-2"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="bg-bg-card sm:rounded-2xl sm:border border-border p-4 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${author?.username || ''}`}>
              <Avatar src={author?.avatar_url} name={author?.display_name} size="md" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${author?.username || ''}`} className="font-semibold text-text-primary hover:text-blue-primary transition-colors">
                  {author?.display_name || 'Anonymous'}
                </Link>
                {locality && (
                  <Link href={`/${locality.slug}`}>
                    <Badge variant="primary" className="text-xs">
                      {locality.emoji} {locality.name}
                    </Badge>
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-dim mt-0.5">
                <span>@{author?.username}</span>
                <span>·</span>
                <span>{timeAgo(created_at)}</span>
              </div>
            </div>
          </div>
          
          {user?.id === author?.id ? (
            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to delete this post?')) {
                  setIsDeleting(true);
                  const res = await deletePost(id);
                  if (res?.success) router.push('/');
                  else { alert('Failed to delete post'); setIsDeleting(false); }
                }
              }}
              disabled={isDeleting}
              className="p-2 text-text-dim hover:text-accent-red hover:bg-bg-elevated rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          ) : (
            <button className="p-2 text-text-dim hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors">
              <MoreHorizontal size={20} />
            </button>
          )}
        </div>

        {/* Title & Content */}
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary font-[family-name:var(--font-poppins)] mb-4 leading-snug break-words">
          {title}
        </h1>

        {post_type === 'image' && image_url && (
          <div className="w-full rounded-xl overflow-hidden bg-bg-elevated mb-6 shadow-sm border border-border flex justify-center">
            <img 
              src={image_url} 
              alt={title} 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        )}

        {content && (
          <div className="prose max-w-none mb-6">
            <p className="text-base sm:text-lg text-text-primary leading-relaxed whitespace-pre-wrap break-words">
              {content}
            </p>
          </div>
        )}

        {/* Poll Options */}
        {post_type === 'poll' && poll_options.length > 0 && (
          <div className="mb-6 bg-bg-elevated/50 p-4 rounded-xl border border-border">
            <h3 className="text-sm font-semibold text-text-dim mb-3 uppercase tracking-wide">Cast your vote</h3>
            <PollVoter postId={id} options={poll_options} initialVotedOptionId={post.user_voted_option_id} />
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag) => (
              <Link key={tag} href={`/search?q=${tag}`}>
                <Badge variant="secondary" className="text-xs hover:opacity-80">
                  #{tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between py-3 border-y border-border">
          <ReactionBar reactions={reactions_summary} size="md" />
          
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="flex items-center gap-1.5 text-text-dim hover:text-blue-primary transition-colors">
              <MessageSquare size={18} />
              <span className="text-sm font-medium">{formatNumber(comment_count)}</span>
            </button>
            <button 
              onClick={() => toggleSave(id)}
              className={`flex items-center gap-1.5 transition-colors ${isSaved(id) ? 'text-accent-amber' : 'text-text-dim hover:text-accent-amber'}`}
            >
              <Bookmark size={18} fill={isSaved(id) ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline text-sm font-medium">{isSaved(id) ? 'Saved' : 'Save'}</span>
            </button>
            <button className="flex items-center gap-1.5 text-text-dim hover:text-accent-green transition-colors">
              <Share2 size={18} />
              <span className="hidden sm:inline text-sm font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comment Section */}
        <CommentSection postId={id} postOwnerId={user_id} />
      </div>
    </article>
  );
}
