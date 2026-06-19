'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import AdvicePollVoter from './AdvicePollVoter';
import AdviceReplySection from './AdviceReplySection';
import { ADVICE_CATEGORIES_MAP } from './AdviceFeedCard';
import { toggleAdviceReaction, toggleFollowAdvice, addAdviceUpdate, fetchAdvicePostBySlug, fetchAdviceReplies } from '@/app/actions/advice';
import { HeartHandshake, Bell, BellOff, Calendar, MapPin, Sparkles, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdviceDetailContainer({ initialPost, initialReplies, user }) {
  const [post, setPost] = useState(initialPost);
  const [replies, setReplies] = useState(initialReplies);
  const [updateText, setUpdateText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const isPostOwner = user && user.id === post.user_id;
  const categoryInfo = ADVICE_CATEGORIES_MAP[post.category] || ADVICE_CATEGORIES_MAP.general;

  const reloadPostAndReplies = async () => {
    try {
      const updatedPost = await fetchAdvicePostBySlug(post.slug);
      const updatedReplies = await fetchAdviceReplies(post.id);
      if (updatedPost) setPost(updatedPost);
      if (updatedReplies) setReplies(updatedReplies);
    } catch (err) {
      console.error('Failed to reload advice details:', err);
    }
  };

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error('Please log in to follow questions');
      return;
    }
    
    // Optimistic UI update
    setPost(prev => ({
      ...prev,
      is_following: !prev.is_following,
      followers_count: prev.is_following ? Math.max(prev.followers_count - 1, 0) : prev.followers_count + 1
    }));

    try {
      const res = await toggleFollowAdvice(post.id);
      if (res?.error) {
        toast.error(res.error);
        // Revert
        reloadPostAndReplies();
      } else {
        toast.success(res.action === 'followed' ? 'Following advice thread' : 'Stopped following');
      }
    } catch (err) {
      reloadPostAndReplies();
    }
  };

  const handleReactionClick = async (emoji) => {
    if (!user) {
      toast.error('Please log in to react');
      return;
    }

    // Optimistic reaction toggle
    setPost(prev => {
      const userReactions = [...prev.user_reactions];
      const reactionsSummary = { ...prev.reactions_summary };
      const hasReacted = userReactions.includes(emoji);

      if (hasReacted) {
        const idx = userReactions.indexOf(emoji);
        userReactions.splice(idx, 1);
        reactionsSummary[emoji] = Math.max((reactionsSummary[emoji] || 1) - 1, 0);
      } else {
        userReactions.push(emoji);
        reactionsSummary[emoji] = (reactionsSummary[emoji] || 0) + 1;
      }

      return {
        ...prev,
        user_reactions: userReactions,
        reactions_summary: reactionsSummary
      };
    });

    try {
      const res = await toggleAdviceReaction(post.id, emoji);
      if (res?.error) {
        toast.error(res.error);
        reloadPostAndReplies();
      }
    } catch (err) {
      reloadPostAndReplies();
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (!updateText.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await addAdviceUpdate(post.id, updateText);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Advice update posted successfully!');
        setUpdateText('');
        setShowUpdateForm(false);
        reloadPostAndReplies();
      }
    } catch (err) {
      toast.error('Failed to post update.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Advice Header Info */}
      <article className="bg-bg-card rounded-3xl border border-border p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Category Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
            <span>{categoryInfo.emoji}</span>
            <span>{categoryInfo.label}</span>
          </span>

          <div className="flex items-center gap-2">
            {/* Locality Tag */}
            {post.localities && (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-bg-elevated px-3 py-1.5 rounded-xl border border-border/50">
                <MapPin size={12} className="text-purple-secondary" />
                <span>{post.localities.emoji} {post.localities.name}</span>
              </span>
            )}

            {/* Follow Button */}
            <button
              onClick={handleToggleFollow}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                post.is_following
                  ? 'bg-blue-primary/10 text-blue-primary border-blue-200'
                  : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
              }`}
            >
              {post.is_following ? <BellOff size={13} /> : <Bell size={13} />}
              <span>{post.is_following ? 'Unfollow' : 'Follow Thread'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-2xl font-black text-text-primary leading-tight font-[family-name:var(--font-poppins)]">
          {post.title}
        </h1>

        {/* Author details */}
        <div className="flex items-center gap-3 text-xs text-text-dim border-b border-border pb-4">
          {post.anonymous_mode ? (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shadow-inner">
              ☕
            </div>
          ) : (
            <Avatar 
              src={post.profiles?.avatar_url} 
              name={post.profiles?.display_name || post.profiles?.username} 
              size="sm" 
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary text-sm">
              {post.anonymous_mode ? 'Anonymous User ☕' : (post.profiles?.display_name || post.profiles?.username || 'User')}
            </span>
            <span className="flex items-center gap-1 mt-0.5">
              <Calendar size={12} />
              <span>Asked {formatDistanceToNow(new Date(post.created_at))} ago</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {post.additional_details && (
            <div className="bg-bg-elevated/40 border border-border/60 rounded-2xl p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-dim block">
                Additional Details
              </span>
              <p className="text-text-muted text-xs leading-relaxed whitespace-pre-wrap">
                {post.additional_details}
              </p>
            </div>
          )}
        </div>

        {/* Image Attachment */}
        {post.image_url && (
          <div className="rounded-2xl overflow-hidden border border-border bg-bg-elevated max-h-96 flex justify-center">
            <img src={post.image_url} alt="Advice context attachment" className="max-h-96 object-contain" />
          </div>
        )}

        {/* Poll voter container */}
        {post.is_poll && (
          <div className="pt-2">
            <AdvicePollVoter post={post} onVoteSuccess={reloadPostAndReplies} />
          </div>
        )}

        {/* Chronological Author Updates timeline */}
        {post.updates && post.updates.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50/20 to-purple-50/20 border border-blue-100 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-blue-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Updates from Author</span>
            </h4>
            <div className="space-y-3 relative border-l-2 border-blue-200/50 pl-4 ml-1.5">
              {post.updates.map((up) => (
                <div key={up.id} className="space-y-1 relative">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-blue-500 border border-white" />
                  <span className="text-[10px] text-text-dim font-semibold block">
                    {formatDistanceToNow(new Date(up.created_at))} ago
                  </span>
                  <p className="text-text-muted text-xs leading-relaxed">
                    {up.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Social interactions */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-border pt-4 text-xs">
          {/* Support reactions list */}
          <div className="flex items-center gap-1.5">
            {['🙏', '☕', '❤️', '👏', '🌟'].map((emoji) => {
              const count = post.reactions_summary?.[emoji] || 0;
              const hasReacted = post.user_reactions?.includes(emoji);
              let label = '';
              if (emoji === '🙏') label = 'Helpful';
              if (emoji === '☕') label = 'Relate';
              if (emoji === '❤️') label = 'Support';
              if (emoji === '👏') label = 'Great';
              if (emoji === '🌟') label = 'Excellent';

              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border transition-all active:scale-95 ${
                    hasReacted
                      ? 'bg-blue-primary/10 text-blue-primary border-blue-200 font-bold'
                      : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
                  }`}
                  title={label}
                >
                  <span>{emoji}</span>
                  {count > 0 && <span className="font-semibold text-[10px]">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-text-dim font-medium">
            <span className="flex items-center gap-1">
              <MessageSquare size={13} />
              <span>{post.replies_count || 0} advice offered</span>
            </span>
            <span>•</span>
            <span>{post.followers_count || 0} following thread</span>
          </div>
        </div>

        {/* Author Update Action Button */}
        {isPostOwner && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="rounded-full text-blue-primary border-blue-200"
            >
              {showUpdateForm ? 'Close Update Form' : '✏️ Post Status Update'}
            </Button>
          </div>
        )}
      </article>

      {/* Author Update Input Form (Conditional) */}
      {isPostOwner && showUpdateForm && (
        <form onSubmit={handlePostUpdate} className="bg-bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm animate-slide-up">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">
              Update your advice thread
            </label>
            <p className="text-[11px] text-text-dim mb-2 leading-tight">
              Share the resolution, new developments, or thank your neighbors. All thread followers will be notified immediately.
            </p>
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="e.g., Thank you everyone for the guidance! I had a discussion with my family and decided to take the Remote Job option..."
              rows={3}
              required
              disabled={isUpdating}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-blue-primary transition-all resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowUpdateForm(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="xs"
              disabled={isUpdating || !updateText.trim()}
              loading={isUpdating}
              className="rounded-full px-5 font-bold"
            >
              Post Update
            </Button>
          </div>
        </form>
      )}

      {/* Replies / Guidance Section */}
      <AdviceReplySection 
        postId={post.id} 
        postOwnerId={post.user_id} 
        initialReplies={replies} 
        user={user} 
        onUpdate={reloadPostAndReplies} 
      />
    </div>
  );
}
