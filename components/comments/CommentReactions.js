'use client';

import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Smile, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function CommentReactions({ commentId, reactions = [], onReact }) {
  const { user } = useAuthStore();
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  
  const containerRef = useRef(null);
  const pressTimer = useRef(null);
  const isLongPress = useRef(false);

  // Group reactions: { [emoji]: { count: number, userReacted: boolean, users: string[] } }
  const groupedReactions = {};
  reactions.forEach(r => {
    const emoji = r.emoji;
    const name = r.profiles?.display_name || r.profiles?.username || 'Someone';
    
    if (!groupedReactions[emoji]) {
      groupedReactions[emoji] = {
        count: 0,
        userReacted: false,
        users: []
      };
    }
    
    groupedReactions[emoji].count += 1;
    groupedReactions[emoji].users.push(name);
    if (user && r.user_id === user.id) {
      groupedReactions[emoji].userReacted = true;
    }
  });

  // Handle closing when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowFloatingBar(false);
        setShowFullPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectEmoji = (emoji) => {
    if (onReact) onReact(emoji);
    setShowFloatingBar(false);
    setShowFullPicker(false);
  };

  // Quick 👍 tap vs long press logic for the reaction trigger
  const triggerTouchStart = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowFloatingBar(true);
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    }, 500); // 500ms long press threshold
  };

  const triggerTouchEnd = (e) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    if (!isLongPress.current) {
      // Normal click/tap: React with quick 👍
      handleSelectEmoji('👍');
    }
    e.preventDefault();
  };

  const triggerMouseDown = (e) => {
    // Only handle mouse clicks for non-touch to open bar
    if (e.type === 'mousedown' && !('ontouchstart' in window)) {
      setShowFloatingBar(!showFloatingBar);
    }
  };

  return (
    <div ref={containerRef} className="flex items-center gap-2 relative select-none">
      
      {/* Grouped Reactions Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Object.entries(groupedReactions).map(([emoji, data]) => (
          <div key={emoji} className="relative group">
            <button
              onClick={() => handleSelectEmoji(emoji)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200",
                data.userReacted
                  ? "bg-blue-primary/10 border-blue-primary/30 text-blue-primary scale-105"
                  : "bg-bg-elevated hover:bg-bg-card-hover border-border-light text-text-primary"
              )}
            >
              <span>{emoji}</span>
              <span>{data.count}</span>
            </button>

            {/* Hover Tooltip (Desktop) */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-black/90 text-white text-[10px] p-2 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-center shadow-lg leading-tight">
              <span className="font-bold block mb-0.5">Reacted by:</span>
              <span>
                {data.users.length > 3
                  ? `${data.users.slice(0, 3).join(', ')} and ${data.users.length - 3} others`
                  : data.users.join(', ')}
              </span>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Reactions Button */}
      <div className="relative">
        <button
          onMouseDown={triggerMouseDown}
          onTouchStart={triggerTouchStart}
          onTouchEnd={triggerTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="React to comment"
          className="p-1 rounded-full text-text-dim hover:text-blue-primary hover:bg-bg-elevated transition-colors duration-200 flex items-center justify-center cursor-pointer"
        >
          <Smile size={16} />
        </button>

        {/* WhatsApp/Instagram style quick floating reaction bar */}
        {showFloatingBar && (
          <div className="absolute bottom-full left-0 mb-2 flex items-center gap-1.5 p-1.5 bg-bg-card/90 backdrop-blur-md border border-border shadow-[0_8px_30px_rgb(0,0,0,0.15)] rounded-full z-40 animate-bounce-in">
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSelectEmoji(emoji)}
                className="text-xl hover:scale-130 active:scale-95 transition-transform p-1 rounded-full flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
            
            {/* Plus button to open searchable picker */}
            <button
              onClick={() => {
                setShowFullPicker(true);
                setShowFloatingBar(false);
              }}
              className="w-7 h-7 bg-bg-elevated hover:bg-bg-card-hover border border-border rounded-full flex items-center justify-center text-text-dim hover:text-text-primary transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        {/* Searchable Emoji Picker Overlay */}
        {showFullPicker && (
          <div className={cn(
            "z-50 shadow-2xl transition-all duration-300",
            // Responsive layout: Bottom Sheet on Mobile, Absolute Popover on Desktop
            "fixed inset-x-0 bottom-0 max-h-[70vh] bg-bg-card border-t border-border rounded-t-3xl sm:absolute sm:inset-auto sm:bottom-full sm:left-0 sm:mb-2 sm:rounded-2xl sm:border sm:max-h-none sm:w-[350px]"
          )}>
            {/* Header only for mobile drag/dismiss bar */}
            <div className="w-full flex justify-center py-3 sm:hidden border-b border-border mb-2 bg-bg-elevated/50 rounded-t-3xl">
              <div className="w-12 h-1 bg-border rounded-full" />
            </div>

            <div className="p-1 sm:p-0">
              <EmojiPicker
                onEmojiClick={(emojiData) => handleSelectEmoji(emojiData.emoji)}
                width="100%"
                height={typeof window !== 'undefined' && window.innerWidth < 640 ? "350px" : "400px"}
                lazyLoadEmojis={true}
                skinTonesDisabled={false}
                searchPlaceHolder="Search emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>

            {/* Mobile dismiss button */}
            <div className="p-3 sm:hidden flex justify-end bg-bg-elevated/20">
              <button
                onClick={() => setShowFullPicker(false)}
                className="px-4 py-2 bg-bg-elevated border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-bg-card-hover"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
