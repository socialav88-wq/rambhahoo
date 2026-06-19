'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ThumbsUp, MessageSquare, Share2, SmilePlus } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import ReactionBar from '@/components/reactions/ReactionBar';
import { REACTIONS } from '@/lib/constants';
import { toggleReaction } from '@/app/actions/interactions';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export default function PostFooter({ post }) {
  const { user } = useAuthStore();
  const [showPicker, setShowPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef(null);
  
  // Floating emojis state
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  
  // Local optimistic state for reactions
  const [localReactions, setLocalReactions] = useState(post.reactions_summary || {});
  
  // The default emoji triggered by the main like button
  const defaultEmoji = '👍';
  
  // Track if the current user has reacted with the default emoji
  const initialHasLiked = (post.user_reactions || []).includes(defaultEmoji);
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [likeAnimate, setLikeAnimate] = useState(false);

  useEffect(() => {
    setLocalReactions(post.reactions_summary || {});
    setHasLiked((post.user_reactions || []).includes(defaultEmoji));
  }, [post.reactions_summary, post.user_reactions]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (shareRef.current && !shareRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShowPicker(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowPicker(false);
  };

  const handleReact = async (emoji) => {
    if (!user) {
      toast.error('Please login to react');
      return;
    }
    setShowPicker(false);
    setShowFullPicker(false);
    setIsReacting(true);
    
    // Add floating animation
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1200);

    const isDefaultEmoji = emoji === defaultEmoji;
    
    // Optimistic update
    const currentCount = localReactions[emoji] || 0;
    
    if (isDefaultEmoji) {
      setHasLiked(!hasLiked); // toggle
      if (!hasLiked) {
        setLikeAnimate(true);
        setTimeout(() => setLikeAnimate(false), 500); // Reset animation state
      }
    }
    
    let newCount;
    if (isDefaultEmoji) {
      newCount = hasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    } else {
      newCount = currentCount + 1;
    }
    
    setLocalReactions({
      ...localReactions,
      [emoji]: newCount
    });

    const res = await toggleReaction(post.id, null, emoji);
    if (res?.error) {
      // Revert if error
      if (isDefaultEmoji) setHasLiked(hasLiked);
      setLocalReactions({
        ...localReactions,
        [emoji]: currentCount
      });
      toast.error('Failed to react');
    } else if (res?.action === 'removed') {
      // It was actually a toggle-off
      if (isDefaultEmoji) setHasLiked(false);
      setLocalReactions({
        ...localReactions,
        [emoji]: Math.max(0, currentCount - (isDefaultEmoji ? 0 : 1))
      });
    } else if (res?.action === 'added') {
      if (isDefaultEmoji) setHasLiked(true);
      toast.success(`Reacted with ${emoji}`);
    }
    setIsReacting(false);
  };

  const getPostUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/post/${post.slug}`;
  };

  const getPostText = () => {
    return `Check this out on Rambhahoo: "${post.title}"`;
  };

  const copyToClipboard = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(getPostUrl());
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const shareWhatsApp = (e) => {
    e.preventDefault();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getPostText() + ' ' + getPostUrl())}`, '_blank');
    setShowShareMenu(false);
  };

  const shareX = (e) => {
    e.preventDefault();
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(getPostText())}&url=${encodeURIComponent(getPostUrl())}`, '_blank');
    setShowShareMenu(false);
  };

  const shareFacebook = (e) => {
    e.preventDefault();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getPostUrl())}`, '_blank');
    setShowShareMenu(false);
  };

  const shareNative = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content ? post.content.substring(0, 100) : post.title,
        url: getPostUrl(),
      }).catch(console.error);
    } else {
      copyToClipboard(e);
    }
    setShowShareMenu(false);
  };

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 relative">
      {/* Floating Emojis Overlay */}
      {floatingEmojis.map((floating) => (
        <div 
          key={floating.id} 
          className="absolute left-8 bottom-8 text-4xl animate-float-up pointer-events-none z-50 drop-shadow-md"
        >
          {floating.emoji}
        </div>
      ))}

      <div className="flex items-center gap-2 relative" onMouseLeave={handleMouseLeave}>
        <div onMouseEnter={handleMouseEnter} className="relative z-10 flex items-center">
           <button 
             onClick={(e) => { e.preventDefault(); handleReact(defaultEmoji); }}
             disabled={isReacting}
             className={`flex items-center gap-1.5 p-2 rounded-full transition-all active:scale-95 ${
               hasLiked 
                 ? 'text-pink-500 bg-pink-500/10' 
                 : 'text-text-dim hover:bg-bg-elevated hover:text-pink-500'
             } ${likeAnimate ? 'animate-bounce-in scale-110' : ''}`}
           >
             <ThumbsUp size={18} className={hasLiked ? 'fill-current' : ''} />
             <span className="text-xs font-medium">Like</span>
           </button>
           
           {/* Custom Emoji Picker Trigger */}
           <button
             onClick={(e) => { e.preventDefault(); setShowFullPicker(!showFullPicker); setShowPicker(false); }}
             className="ml-1 p-2 text-text-dim hover:bg-bg-elevated hover:text-blue-primary rounded-full transition-all active:scale-95"
           >
             <SmilePlus size={18} />
           </button>
        </div>

        {/* Reaction picker popover */}
        {showPicker && !showFullPicker && (
          <div 
            className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-bg-card border border-border rounded-xl shadow-md z-20 animate-bounce-in"
            onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          >
             {REACTIONS.map(({ emoji, label }) => (
               <button
                 key={emoji}
                 onClick={(e) => { e.preventDefault(); handleReact(emoji); }}
                 title={label}
                 className="text-xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-bg-card-hover"
               >
                 {emoji}
               </button>
             ))}
          </div>
        )}

        {/* Full Emoji Picker */}
        {showFullPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50 animate-slide-up shadow-2xl rounded-2xl overflow-hidden border border-border/50">
            <EmojiPicker 
              onEmojiClick={(emojiData) => handleReact(emojiData.emoji)}
              theme="light"
              lazyLoadEmojis={true}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{ showPreview: false }}
              height={350}
            />
          </div>
        )}

        {/* Reaction Bar for existing reactions */}
        <div className="ml-2 hidden xs:block">
          <ReactionBar reactions={localReactions} compact size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Link href={`/post/${post.slug}`} className="flex items-center gap-1.5 p-2 text-text-dim hover:bg-bg-elevated hover:text-blue-primary rounded-full transition-all active:scale-95">
          <MessageSquare size={18} />
          <span className="text-xs font-medium">{formatNumber(post.comment_count || 0)}</span>
        </Link>
        <div className="relative" ref={shareRef}>
          <button 
            onClick={(e) => { e.preventDefault(); setShowShareMenu(!showShareMenu); }}
            aria-label="Share post" 
            className={`flex items-center gap-1.5 p-2 rounded-full transition-all active:scale-95 ${
              showShareMenu ? 'text-accent-green bg-accent-green/10' : 'text-text-dim hover:bg-bg-elevated hover:text-accent-green'
            }`}
          >
            <Share2 size={18} />
            <span className="text-xs font-medium hidden sm:inline">Share</span>
          </button>
          
          {showShareMenu && (
            <div className="absolute right-0 bottom-full mb-2 bg-bg-card border border-border rounded-xl shadow-lg py-2 w-48 z-30 animate-bounce-in">
              <button 
                onClick={shareWhatsApp} 
                className="w-full text-left px-4 py-2 hover:bg-bg-card-hover text-sm text-text-primary flex items-center gap-2"
              >
                <span>💬</span> WhatsApp
              </button>
              <button 
                onClick={shareX} 
                className="w-full text-left px-4 py-2 hover:bg-bg-card-hover text-sm text-text-primary flex items-center gap-2"
              >
                <span>𝕏</span> X (Twitter)
              </button>
              <button 
                onClick={shareFacebook} 
                className="w-full text-left px-4 py-2 hover:bg-bg-card-hover text-sm text-text-primary flex items-center gap-2"
              >
                <span>👤</span> Facebook
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button 
                  onClick={shareNative} 
                  className="w-full text-left px-4 py-2 hover:bg-bg-card-hover text-sm text-text-primary flex items-center gap-2"
                >
                  <span>📤</span> Share Via...
                </button>
              )}
              <div className="border-t border-border/50 my-1"></div>
              <button 
                onClick={copyToClipboard} 
                className="w-full text-left px-4 py-2 hover:bg-bg-card-hover text-sm text-text-primary flex items-center gap-2 font-medium"
              >
                <span>🔗</span> Copy Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
