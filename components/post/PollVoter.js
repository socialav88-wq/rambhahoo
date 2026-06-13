'use client';

import { useState, useTransition, useEffect } from 'react';
import { CheckCircle2, Loader2, BarChart3 } from 'lucide-react';
import { votePoll } from '@/app/actions/interactions';
import { useAuthStore } from '@/store/authStore';
import { formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PollVoter({ postId, options = [], initialVotedOptionId = null, compact = false }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Compute initial state from options
  const initialTotal = options.reduce((s, o) => s + (o.vote_count || 0), 0);

  const [votes, setVotes] = useState(() => {
    const map = {};
    options.forEach(o => { map[o.id] = o.vote_count || 0; });
    return map;
  });
  const [total, setTotal] = useState(initialTotal);
  const [voted, setVoted] = useState(initialVotedOptionId); // optionId user voted for
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`poll_options_updates_${postId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'poll_options' },
        (payload) => {
          const updatedOption = payload.new;
          // Only update if this option belongs to our list of options
          if (options.some(o => o.id === updatedOption.id)) {
            setVotes(prev => {
              const newVotes = { ...prev, [updatedOption.id]: updatedOption.vote_count };
              const newTotal = Object.values(newVotes).reduce((sum, val) => sum + val, 0);
              setTotal(newTotal);
              return newVotes;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options, postId]);

  const handleVote = (optionId) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (voted || isPending) return;

    // Optimistic update immediately
    setVoted(optionId);
    setVotes(prev => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }));
    setTotal(prev => prev + 1);

    startTransition(async () => {
      const result = await votePoll(postId, optionId);
      if (result?.error) {
        // Rollback on error
        setVoted(null);
        setVotes(prev => ({ ...prev, [optionId]: Math.max((prev[optionId] || 1) - 1, 0) }));
        setTotal(prev => Math.max(prev - 1, 0));
        if (result.error !== 'Already voted on this poll') {
          setError(result.error);
        }
      }
    });
  };

  const hasVoted = voted !== null;

  return (
    <div className="space-y-2">
      {options
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((option) => {
          const count = votes[option.id] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isChosen = voted === option.id;
          const isLeading = hasVoted && count === Math.max(...Object.values(votes));

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted || isPending}
              className={[
                'relative w-full text-left rounded-xl overflow-hidden transition-all duration-200',
                compact ? 'p-2.5' : 'p-3.5',
                hasVoted
                  ? isChosen
                    ? 'border-2 border-blue-primary cursor-default'
                    : 'border border-border cursor-default'
                  : 'border border-border hover:border-blue-primary hover:bg-blue-primary/5 cursor-pointer active:scale-[0.98]',
              ].join(' ')}
            >
              {/* Progress bar fills behind content */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-xl ${
                    isChosen ? 'bg-blue-primary/15' : 'bg-bg-elevated'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}

              {/* Content row */}
              <div className="relative flex items-center justify-between gap-3 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  {hasVoted && isChosen && (
                    <CheckCircle2
                      size={compact ? 14 : 16}
                      className="text-blue-primary shrink-0"
                    />
                  )}
                  <span
                    className={[
                      'truncate',
                      compact ? 'text-sm' : 'text-base',
                      isChosen
                        ? 'font-semibold text-blue-primary'
                        : hasVoted
                        ? 'font-medium text-text-primary'
                        : 'font-medium text-text-primary',
                    ].join(' ')}
                  >
                    {option.option_text}
                  </span>
                  {hasVoted && isLeading && (
                    <span className="text-[10px] font-bold text-accent-amber bg-accent-amber/10 px-1.5 py-0.5 rounded-full shrink-0">
                      LEADING
                    </span>
                  )}
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-sm font-bold ${isChosen ? 'text-blue-primary' : 'text-text-muted'}`}>
                      {pct}%
                    </span>
                    {!compact && (
                      <span className="text-xs text-text-dim">({formatNumber(count)})</span>
                    )}
                  </div>
                )}

                {!hasVoted && isPending && voted === null && (
                  <Loader2 size={14} className="animate-spin text-text-dim shrink-0" />
                )}
              </div>
            </button>
          );
        })}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-text-dim">
          <BarChart3 size={12} />
          <span>{formatNumber(total)} vote{total !== 1 ? 's' : ''}</span>
        </div>
        {!user && !hasVoted && (
          <span className="text-xs text-text-dim">
            <button
              onClick={() => router.push('/login')}
              className="text-blue-primary hover:underline font-medium"
            >
              Log in
            </button>{' '}
            to vote
          </span>
        )}
        {hasVoted && (
          <span className="text-xs text-accent-green font-medium flex items-center gap-1">
            <CheckCircle2 size={11} />
            Vote recorded
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-accent-red mt-1">{error}</p>
      )}
    </div>
  );
}
