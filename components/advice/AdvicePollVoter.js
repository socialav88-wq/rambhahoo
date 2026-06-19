'use client';

import { useState } from 'react';
import { voteAdvicePoll } from '@/app/actions/advice';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdvicePollVoter({ post, onVoteSuccess }) {
  const [isVoting, setIsVoting] = useState(false);
  const options = post.poll_options || [];
  const userVotedId = post.user_voted_option_id;

  const totalVotes = options.reduce((sum, opt) => sum + (opt.vote_count || 0), 0);

  const handleVote = async (optionId) => {
    if (isVoting || userVotedId) return;
    setIsVoting(true);

    try {
      const res = await voteAdvicePoll(post.id, optionId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success('Vote registered!');
        if (onVoteSuccess) onVoteSuccess();
      }
    } catch (err) {
      toast.error('Failed to register vote.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-bg-elevated rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between text-xs text-text-dim px-1">
        <span className="font-semibold uppercase tracking-wider">Community Opinion Poll</span>
        <span>{totalVotes} total votes</span>
      </div>

      <div className="space-y-2.5">
        {options.map((opt) => {
          const voteCount = opt.vote_count || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVotedThis = userVotedId === opt.id;

          if (userVotedId) {
            // Render results
            return (
              <div key={opt.id} className="relative overflow-hidden rounded-xl border border-border bg-bg-card p-3 flex justify-between items-center text-sm font-medium">
                {/* Progress bar background fill */}
                <div 
                  className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ${
                    hasVotedThis ? 'bg-blue-primary/10' : 'bg-text-dim/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                
                <span className="relative z-10 flex items-center gap-2 text-text-primary">
                  {opt.option_text}
                  {hasVotedThis && <Check size={16} className="text-blue-primary" />}
                </span>
                
                <span className="relative z-10 text-text-muted text-xs">
                  {percentage}% ({voteCount})
                </span>
              </div>
            );
          }

          // Render clickable buttons
          return (
            <button
              key={opt.id}
              type="button"
              disabled={isVoting}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left rounded-xl border border-border bg-bg-card p-3 text-sm text-text-primary hover:border-blue-primary/50 hover:bg-bg-elevated active:scale-[0.99] transition-all duration-200"
            >
              {opt.option_text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
