'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useFeedStore } from '@/store/feedStore';
import toast from 'react-hot-toast';

export default function RealtimeProvider({ children }) {
  const { user } = useAuthStore();
  const setUnreadNotificationsCount = useUIStore((s) => s.setUnreadNotificationsCount);
  const incrementUnreadNotificationsCount = useUIStore((s) => s.incrementUnreadNotificationsCount);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (!error) {
        setUnreadNotificationsCount(count || 0);
      }
    };
    fetchUnreadCount();

    // Helper to fetch full post data for insertion/update
    const fetchPostData = async (postId) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, display_name, avatar_url),
          localities:locality_id (slug, name, emoji),
          poll_options (id, option_text, vote_count, sort_order),
          events (event_date, location_name, rsvp_count),
          reactions (emoji)
        `)
        .eq('id', postId)
        .single();
      if (error || !data) return null;

      const summary = {};
      (data.reactions || []).forEach(r => {
        summary[r.emoji] = (summary[r.emoji] || 0) + 1;
      });

      return {
        ...data,
        post_type: data.post_type === 'meme' ? 'image' : data.post_type,
        reactions_summary: summary,
        user_reactions: [], // default empty, will load user specific on page load if needed
        user_voted_option_id: null
      };
    };

    const pendingUpdates = new Map();

    const isPostInFeed = (postId) => {
      const currentPosts = useFeedStore.getState().posts;
      return currentPosts.some(p => p.id === postId);
    };

    const fetchAndInsertPost = async (postId) => {
      const fullPost = await fetchPostData(postId);
      if (fullPost) {
        const currentPosts = useFeedStore.getState().posts;
        if (!currentPosts.some(p => p.id === postId)) {
          useFeedStore.setState({ posts: [fullPost, ...currentPosts] });
        }
      }
    };

    const fetchAndUpdatePost = async (postId) => {
      const fullPost = await fetchPostData(postId);
      if (fullPost) {
        const { updatePost } = useFeedStore.getState();
        updatePost(postId, {
          title: fullPost.title,
          content: fullPost.content,
          image_url: fullPost.image_url,
          reaction_count: fullPost.reaction_count,
          comment_count: fullPost.comment_count,
          view_count: fullPost.view_count,
          reactions_summary: fullPost.reactions_summary,
          poll_options: fullPost.poll_options,
          events: fullPost.events
        });
      }
    };

    const fetchAndUpdatePostDebounced = (postId) => {
      if (pendingUpdates.has(postId)) {
        clearTimeout(pendingUpdates.get(postId));
      }
      const timeout = setTimeout(async () => {
        pendingUpdates.delete(postId);
        await fetchAndUpdatePost(postId);
      }, 1200); // 1.2s quiet period debounce
      pendingUpdates.set(postId, timeout);
    };

    // Listen to new notifications directed to the current user
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const notif = payload.new;
          
          // Increment local unread notifications count
          incrementUnreadNotificationsCount();
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', notif.actor_id)
            .single();

          const name = sender?.display_name || sender?.username || 'Someone';

          let message = '';
          let icon = '🔔';

          if (notif.type === 'CIRCLE_ADD' || notif.type === 'circle' || notif.type === 'follow') {
            message = `${name} added you to their Circle`;
            icon = '🤝';
          } else if (notif.type === 'POST_COMMENT' || notif.type === 'comment') {
            message = `${name} commented on your post`;
            icon = '💬';
          } else if (notif.type === 'COMMENT_REPLY') {
            message = `${name} replied to your comment`;
            icon = '💬';
          } else if (notif.type === 'POST_LIKE' || notif.type === 'like') {
            message = `${name} liked your post`;
            icon = '👍';
          } else if (notif.type === 'POST_REACTION') {
            const emoji = notif.content || '❤️';
            message = `${name} reacted ${emoji} to your post`;
            icon = emoji;
          } else if (notif.type === 'COMMENT_REACTION') {
            const emoji = notif.content || '❤️';
            message = `${name} reacted ${emoji} to your comment`;
            icon = emoji;
          } else if (notif.type === 'POLL_VOTE') {
            message = `${name} voted in your poll`;
            icon = '🗳️';
          } else if (notif.type === 'MENTION') {
            message = `${name} mentioned you`;
            icon = '🏷️';
          } else if (notif.type === 'POST_REPORT') {
            message = `Reported post: ${notif.content || 'Inappropriate content'}`;
            icon = '⚠️';
          } else if (notif.type === 'SYSTEM') {
            message = notif.content || 'System alert';
            icon = '📢';
          } else if (notif.type === 'EVENT_RSVP' || notif.type === 'rsvp') {
            message = `${name} is going to your event`;
            icon = '📅';
          } else {
            message = `You have a new notification from ${name}`;
          }

          toast(message, {
            icon,
            duration: 5000,
            style: {
              background: '#fff',
              color: '#333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }
          });
        }
      )
      .subscribe();

    // Subscribe to postgres changes on core tables for feed sync
    const dbSyncSubscription = supabase
      .channel('public:db_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchAndInsertPost(payload.new.id);
          } else if (payload.eventType === 'UPDATE') {
            if (isPostInFeed(payload.new.id)) {
              fetchAndUpdatePostDebounced(payload.new.id);
            }
          } else if (payload.eventType === 'DELETE') {
            const currentPosts = useFeedStore.getState().posts;
            useFeedStore.setState({ posts: currentPosts.filter(p => p.id !== payload.old.id) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reactions' },
        async (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (postId && isPostInFeed(postId)) {
            fetchAndUpdatePostDebounced(postId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        async (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (postId && isPostInFeed(postId)) {
            fetchAndUpdatePostDebounced(postId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'poll_votes' },
        async (payload) => {
          const postId = payload.new?.post_id || payload.old?.post_id;
          if (postId && isPostInFeed(postId)) {
            fetchAndUpdatePostDebounced(postId);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          const profileId = payload.new.id;
          const currentPosts = useFeedStore.getState().posts;
          const updatedPosts = currentPosts.map(p => {
            if (p.user_id === profileId) {
              return {
                ...p,
                profiles: {
                  ...p.profiles,
                  username: payload.new.username,
                  display_name: payload.new.display_name,
                  avatar_url: payload.new.avatar_url
                }
              };
            }
            return p;
          });
          useFeedStore.setState({ posts: updatedPosts });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
      supabase.removeChannel(dbSyncSubscription);
      pendingUpdates.forEach((timeout) => clearTimeout(timeout));
      pendingUpdates.clear();
    };
  }, [user, setUnreadNotificationsCount, incrementUnreadNotificationsCount]);

  return <>{children}</>;
}
