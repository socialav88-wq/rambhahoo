'use client';

import { useState } from 'react';
import { addAdviceReply, rateAdviceReply, markBestAdvice } from '@/app/actions/advice';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Check, Heart, Trophy, Award, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdviceReplySection({ postId, postOwnerId, initialReplies, user, onUpdate }) {
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRatingId, setIsRatingId] = useState(null);

  const pinnedReply = initialReplies.find((r) => r.is_best_advice);
  const otherReplies = initialReplies.filter((r) => !r.is_best_advice);

  const isPostOwner = user && user.id === postOwnerId;

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to offer advice');
      return;
    }
    if (!newReplyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await addAdviceReply(postId, newReplyContent);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Your advice has been posted!');
        setNewReplyContent('');
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to post reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRate = async (replyId, ratingType) => {
    if (!user) {
      toast.error('Please log in to rate replies');
      return;
    }
    setIsRatingId(replyId);

    try {
      const res = await rateAdviceReply(replyId, ratingType);
      if (res?.error) {
        toast.error(res.error);
      } else {
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to update rating.');
    } finally {
      setIsRatingId(null);
    }
  };

  const handleToggleBest = async (replyId) => {
    if (!isPostOwner) return;

    try {
      // Toggle: if already pinned, unmark it by passing null
      const targetReplyId = pinnedReply?.id === replyId ? null : replyId;
      const res = await markBestAdvice(postId, targetReplyId);
      
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(targetReplyId ? 'Marked as Best Advice!' : 'Removed Best Advice');
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      toast.error('Failed to toggle Best Advice.');
    }
  };

  const renderReplyCard = (reply, isPinned = false) => {
    const isOwnReply = user && user.id === reply.user_id;
    const userRating = reply.user_rating;

    return (
      <div 
        key={reply.id} 
        className={`bg-bg-card rounded-2xl border p-5 transition-all duration-300 flex flex-col gap-4 relative ${
          isPinned 
            ? 'border-accent-amber bg-gradient-to-br from-amber-500/5 to-yellow-500/5 shadow-md shadow-amber-500/5' 
            : 'border-border shadow-sm'
        }`}
      >
        {/* Pinned Ribbon */}
        {isPinned && (
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-accent-amber/15 text-accent-amber px-3 py-1 rounded-full text-xs font-bold border border-accent-amber/25 uppercase tracking-wide">
            <Trophy size={12} />
            <span>Community Selected Advice</span>
          </div>
        )}

        {/* Reply Author */}
        <div className="flex items-center gap-3 text-xs text-text-dim">
          <Avatar 
            src={reply.profiles?.avatar_url} 
            name={reply.profiles?.display_name || reply.profiles?.username} 
            size="sm" 
          />
          <div className="flex flex-col">
            <span className="font-semibold text-text-primary text-sm">
              {reply.profiles?.display_name || reply.profiles?.username}
            </span>
            <span>{formatDistanceToNow(new Date(reply.created_at))} ago</span>
          </div>
        </div>

        {/* Content */}
        <p className="text-text-muted text-sm leading-relaxed whitespace-pre-wrap">
          {reply.content}
        </p>

        {/* Divider */}
        <div className="border-t border-border/50 my-1" />

        {/* Controls: Ratings and Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
          {/* Quality Voting system */}
          <div className="flex items-center gap-2">
            {/* Helpful Badge */}
            <button
              onClick={() => handleRate(reply.id, 'helpful')}
              disabled={isRatingId === reply.id || isOwnReply}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                userRating === 'helpful'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
              } ${isOwnReply ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>🙏 Helpful</span>
              <span className="font-semibold">{reply.helpful_count || 0}</span>
            </button>

            {/* Very Helpful Badge */}
            <button
              onClick={() => handleRate(reply.id, 'very_helpful')}
              disabled={isRatingId === reply.id || isOwnReply}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                userRating === 'very_helpful'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
              } ${isOwnReply ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>🌟 Very Helpful</span>
              <span className="font-semibold">{reply.very_helpful_count || 0}</span>
            </button>

            {/* Best Advice Rating Badge */}
            <button
              onClick={() => handleRate(reply.id, 'best_advice')}
              disabled={isRatingId === reply.id || isOwnReply}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                userRating === 'best_advice'
                  ? 'bg-amber-50 text-accent-amber border-amber-200'
                  : 'bg-bg-elevated text-text-muted border-border hover:text-text-primary'
              } ${isOwnReply ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span>🏆 Best Advice</span>
              <span className="font-semibold">{reply.best_advice_count || 0}</span>
            </button>
          </div>

          {/* Post Author Pin Actions */}
          {isPostOwner && (
            <button
              onClick={() => handleToggleBest(reply.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-bold transition-all ${
                reply.is_best_advice
                  ? 'bg-accent-amber text-white border-accent-amber hover:bg-accent-amber/90 shadow-sm'
                  : 'bg-bg-card text-text-muted border-border hover:border-accent-amber/50 hover:text-accent-amber'
              }`}
            >
              <Award size={14} />
              <span>{reply.is_best_advice ? 'Pinned Best Advice' : 'Pin as Best Advice'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
        <MessageCircle size={20} className="text-blue-primary" />
        <span>Community Guidance ({initialReplies.length})</span>
      </h3>

      {/* Pinned Best Answer */}
      {pinnedReply && (
        <div className="space-y-2">
          {renderReplyCard(pinnedReply, true)}
        </div>
      )}

      {/* Replies List */}
      {otherReplies.length > 0 ? (
        <div className="space-y-4">
          {otherReplies.map((reply) => renderReplyCard(reply, false))}
        </div>
      ) : (
        !pinnedReply && (
          <div className="text-center py-10 bg-bg-card rounded-2xl border border-dashed border-border text-text-muted text-sm">
            <span className="text-2xl block mb-2">☕</span>
            <span>No advice offered yet. Be the first to share your perspective!</span>
          </div>
        )
      )}

      {/* Answer Submission Form */}
      <form onSubmit={handleAddReply} className="bg-bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Offer your Guidance
          </label>
          <textarea
            value={newReplyContent}
            onChange={(e) => setNewReplyContent(e.target.value)}
            placeholder={
              user 
                ? "Offer compassionate, helpful, and honest advice to help this neighbor..." 
                : "Please log in to offer advice."
            }
            disabled={!user || isSubmitting}
            rows={4}
            required
            className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-blue-primary transition-all resize-y text-sm"
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!user || isSubmitting || !newReplyContent.trim()} 
            loading={isSubmitting}
            className="rounded-full px-6 font-bold"
          >
            Post Advice
          </Button>
        </div>
      </form>
    </div>
  );
}
