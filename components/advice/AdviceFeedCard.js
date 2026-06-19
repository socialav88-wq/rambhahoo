'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { MessageSquare, Users, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ADVICE_CATEGORIES_MAP = {
  career: { label: 'Career Advice', emoji: '💼', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  relationship: { label: 'Relationship Advice', emoji: '❤️', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  money: { label: 'Money Advice', emoji: '💸', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  family: { label: 'Family Advice', emoji: '🏠', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  student: { label: 'Student Advice', emoji: '🎓', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
  startup: { label: 'Startup Advice', emoji: '🚀', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  local: { label: 'Local Advice', emoji: '📍', color: 'bg-sky-50 text-sky-700 border-sky-100' },
  personal: { label: 'Personal Problems', emoji: '😔', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  life_decisions: { label: 'Life Decisions', emoji: '⚖️', color: 'bg-violet-50 text-violet-700 border-violet-100' },
  general: { label: 'General Advice', emoji: '🧠', color: 'bg-gray-50 text-gray-700 border-gray-100' }
};

export default function AdviceFeedCard({ post }) {
  const categoryInfo = ADVICE_CATEGORIES_MAP[post.category] || ADVICE_CATEGORIES_MAP.general;
  const isAnonymous = post.anonymous_mode;

  // Compute total support reactions
  const reactionCountsObj = post.reaction_counts || {};
  const totalReactions = Object.values(reactionCountsObj).reduce((sum, count) => sum + Number(count), 0);

  return (
    <article className="bg-bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-border-light transition-all duration-300 p-5 flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Category Badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${categoryInfo.color}`}>
          <span>{categoryInfo.emoji}</span>
          <span>{categoryInfo.label}</span>
        </span>

        {/* Locality Tag */}
        {post.localities && (
          <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-bg-elevated px-2.5 py-1 rounded-lg border border-border/50">
            <MapPin size={12} className="text-purple-secondary" />
            <span>{post.localities.emoji} {post.localities.name}</span>
          </span>
        )}
      </div>

      {/* Title */}
      <Link href={`/advice/post/${post.slug}`} className="group">
        <h2 className="text-lg font-bold text-text-primary group-hover:text-blue-primary transition-colors leading-snug">
          {post.title}
        </h2>
      </Link>

      {/* Snippet */}
      <p className="text-text-muted text-sm line-clamp-3 leading-relaxed">
        {post.content}
      </p>

      {/* Divider */}
      <div className="border-t border-border/50 my-1" />

      {/* Footer Info */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-text-dim">
        {/* User Profile */}
        <div className="flex items-center gap-2">
          {isAnonymous ? (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs shadow-inner">
              ☕
            </div>
          ) : (
            <Avatar 
              src={post.profiles?.avatar_url} 
              name={post.profiles?.display_name || post.profiles?.username} 
              size="xs" 
              className="w-6 h-6" 
            />
          )}
          <span className="font-medium text-text-muted hover:text-text-primary transition-colors">
            {isAnonymous ? 'Anonymous User ☕' : (post.profiles?.display_name || post.profiles?.username || 'User')}
          </span>
          <span className="text-text-dim">•</span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {totalReactions > 0 && (
            <div className="flex items-center gap-1 text-text-muted" title="Support Reactions">
              <span>🙏</span>
              <span className="font-semibold">{totalReactions}</span>
            </div>
          )}

          <div className="flex items-center gap-1" title="Replies count">
            <MessageSquare size={14} className="text-text-dim" />
            <span className="font-semibold text-text-muted">{post.replies_count || 0} advice</span>
          </div>

          <div className="flex items-center gap-1" title="Followers count">
            <Users size={14} className="text-text-dim" />
            <span className="font-semibold text-text-muted">{post.followers_count || 0} followers</span>
          </div>
        </div>
      </div>
    </article>
  );
}
