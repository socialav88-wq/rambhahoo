'use client';

import { useState } from 'react';
import { REACTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function ReactionBar({ reactions = {}, onReact, userReactions = [], size = 'sm', compact = false }) {
  const [showPicker, setShowPicker] = useState(false);
  
  // reactions is an object like { '💀': 5, '😂': 12, '🔥': 3 }
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);
  
  const handleReact = (emoji) => {
    if (onReact) onReact(emoji);
    setShowPicker(false);
  };

  return (
    <div className="flex items-center gap-1 relative">
      {/* Show existing reactions with counts */}
      {REACTIONS.map(({ emoji }) => {
        const count = reactions[emoji] || 0;
        if (count === 0 && compact) return null;
        const isUserReacted = userReactions.includes(emoji);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className={cn(
              'flex items-center gap-1 rounded-full transition-all duration-200',
              size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
              isUserReacted
                ? 'bg-blue-primary/10 border border-blue-primary/30 scale-105'
                : 'bg-bg-elevated hover:bg-bg-card-hover border border-border-light/50',
              count > 0 ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            )}
          >
            <span className={cn(
              'transition-transform',
              isUserReacted && 'animate-bounce-in'
            )}>{emoji}</span>
            {count > 0 && (
              <span className={cn(
                'font-medium',
                isUserReacted ? 'text-blue-primary' : 'text-text-dim'
              )}>{count}</span>
            )}
          </button>
        );
      })}
      
      {/* Add reaction button */}
      {!compact && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              'rounded-full border border-dashed border-border-light hover:border-blue-primary text-text-dim hover:text-blue-primary transition-all',
              size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'
            )}
          >
            +
          </button>
          
          {/* Picker dropdown */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-bg-card border border-border rounded-xl shadow-md z-20 animate-bounce-in">
              {REACTIONS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  title={label}
                  className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-bg-card-hover"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
