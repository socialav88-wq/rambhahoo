'use client';

import { REACTIONS } from '@/lib/constants';

export default function ReactionPicker({ onSelect, className = '' }) {
  return (
    <div className={`flex gap-1.5 p-2 bg-bg-card border border-border rounded-xl shadow-md ${className}`}>
      {REACTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          title={label}
          className="text-2xl hover:scale-125 active:scale-90 transition-transform p-1.5 rounded-lg hover:bg-bg-card-hover"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
