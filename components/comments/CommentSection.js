'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Send, Loader2, Smile } from 'lucide-react';
import CommentItem from './CommentItem';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { fetchComments } from '@/app/actions/posts';
import { addComment, deleteComment } from '@/app/actions/interactions';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import EmojiPicker from 'emoji-picker-react';

export default function CommentSection({ postId, postOwnerId }) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const emojiPickerRef = useRef(null);
  const { user, profile } = useAuthStore();
  const router = useRouter();

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEmojiSelect = (emojiData) => {
    const emoji = emojiData.emoji;
    const input = document.getElementById('comment-input');
    if (!input) {
      setNewComment(prev => prev + emoji);
      return;
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setNewComment(before + emoji + after);
    
    // Refocus and place cursor after inserted emoji
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 10);
  };

  useEffect(() => {
    async function loadComments() {
      setIsLoading(true);
      const data = await fetchComments(postId);
      setComments(data || []);
      setIsLoading(false);
    }
    loadComments();

    const supabase = createClient();
    const channel = supabase
      .channel(`comments-realtime-${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const updated = await fetchComments(postId);
          setComments(updated || []);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        async (payload) => {
          const updated = await fetchComments(postId);
          setComments(updated || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to comment.");
      router.push('/login');
      return;
    }

    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    
    const content = replyingTo ? `@${replyingTo} ${newComment}` : newComment;
    
    // Optimistic update
    const optimisticComment = {
      id: `temp_${Date.now()}`,
      post_id: postId,
      content,
      created_at: new Date().toISOString(),
      profiles: profile || { username: 'you', display_name: 'You' },
      reactions_summary: {}
    };
    
    setComments((prev) => [...prev, optimisticComment]);
    setNewComment('');
    setReplyingTo(null);
    
    // Real call
    const result = await addComment(postId, content);
    if (result?.error) {
      // Rollback on error
      toast.error(result.error);
      setComments((prev) => prev.filter(c => c.id !== optimisticComment.id));
    } else if (result?.comment) {
      // Replace optimistic with real
      setComments((prev) => prev.map(c => c.id === optimisticComment.id ? result.comment : c));
      toast.success('Comment posted!');
    }
    
    setIsSubmitting(false);
  };

  const handleReply = (username) => {
    setReplyingTo(username);
    const input = document.getElementById('comment-input');
    if (input) input.focus();
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    // Optimistic delete
    setComments(prev => prev.filter(c => c.id !== commentId && !c.replies?.some(r => r.id === commentId)));
    
    const result = await deleteComment(commentId, postId);
    if (result?.error) {
      alert(result.error);
      // Re-fetch comments on failure
      const data = await fetchComments(postId);
      setComments(data || []);
    }
  };

  return (
    <div className="mt-6 border-t border-border pt-6">
      <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-poppins)] mb-6 flex items-center gap-2">
        Comments
        {!isLoading && (
          <span className="text-text-dim text-sm font-normal">({comments.length})</span>
        )}
      </h3>
      
      {/* Comment Input */}
      <div className="flex gap-3 mb-8">
        <div className="shrink-0 pt-1 hidden sm:block">
          <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.username} size="md" />
        </div>
        <form onSubmit={handleSubmit} className="flex-1 relative">
          {replyingTo && (
            <div className="absolute -top-6 left-0 text-xs text-blue-primary flex items-center gap-1 bg-blue-primary/10 px-2 py-0.5 rounded-t-md">
              Replying to @{replyingTo}
              <button 
                type="button" 
                onClick={() => setReplyingTo(null)}
                className="ml-1 hover:text-blue-hover"
              >
                ×
              </button>
            </div>
          )}
          <div className={`relative bg-bg-card border rounded-xl overflow-hidden shadow-sm transition-colors ${replyingTo ? 'border-blue-primary/50 rounded-tl-none' : 'border-border focus-within:border-blue-primary'}`}>
            <textarea
              id="comment-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Add a comment..." : "Log in to comment..."}
              disabled={isSubmitting}
              className="w-full bg-transparent p-3 min-h-[80px] text-sm text-text-primary placeholder:text-text-dim resize-none focus:outline-none disabled:opacity-70"
            />
            <div className="flex justify-between items-center p-2 bg-bg-elevated/50 border-t border-border">
              <div className="flex items-center gap-2 px-1 relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 rounded-full text-text-dim hover:text-blue-primary hover:bg-bg-card transition-colors duration-200 cursor-pointer"
                  title="Insert Emoji"
                >
                  <Smile size={16} />
                </button>
                <span className="text-xs text-text-dim hidden sm:inline">Be respectful</span>

                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-full left-0 mb-2 z-50 shadow-2xl rounded-2xl border border-border"
                  >
                    <EmojiPicker
                      onEmojiClick={handleEmojiSelect}
                      width="320px"
                      height="350px"
                      lazyLoadEmojis={true}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                size="sm" 
                disabled={!newComment.trim() || isSubmitting}
                loading={isSubmitting}
                className="h-8 rounded-lg"
              >
                <Send size={14} className={isSubmitting ? 'hidden' : 'block'} />
                <span className="hidden sm:inline">Post</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Comments List */}
      <div className="space-y-2 pb-8">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onReply={handleReply} 
              onDelete={handleDelete}
              postOwnerId={postOwnerId}
            />
          ))
        ) : (
          <p className="text-center text-text-dim py-8 text-sm">No comments yet. Be the first to start the discussion!</p>
        )}
      </div>
    </div>
  );
}
