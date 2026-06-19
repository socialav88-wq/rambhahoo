'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import { 
  Bell, UserPlus, MessageSquare, Check, CheckCheck, ThumbsUp, Heart, 
  BarChart3, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePushNotifications } from '@/components/providers/PushNotificationProvider';
import { markAsRead, markAllAsRead } from '@/app/actions/notifications';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isSupported, isSubscribed, permissionStatus, subscribeToPush, isSubscribing } = usePushNotifications();
  const [showBanner, setShowBanner] = useState(false);
  
  const unreadCount = useUIStore((s) => s.unreadNotificationsCount);
  const setUnreadNotificationsCount = useUIStore((s) => s.setUnreadNotificationsCount);

  useEffect(() => {
    // Show banner if supported, not subscribed, permission is default, and not dismissed
    const isDismissed = sessionStorage.getItem('push_banner_dismissed') === 'true';
    if (isSupported && !isSubscribed && permissionStatus === 'default' && !isDismissed) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isSupported, isSubscribed, permissionStatus]);

  const handleDismissBanner = () => {
    sessionStorage.setItem('push_banner_dismissed', 'true');
    setShowBanner(false);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchNotificationsData = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (username, display_name, avatar_url),
          post:reference_id (slug, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
        
        // Sync the unread notifications count in state
        const unreadRows = data.filter(n => !n.is_read);
        setUnreadNotificationsCount(unreadRows.length);
      }
      setLoading(false);
    };

    fetchNotificationsData();

    // Listen for realtime insertions of notifications on this page
    const supabase = createClient();
    const realtimeChannel = supabase
      .channel('realtime_notifications_page_list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const newNotif = payload.new;
          
          // Fetch sender and post details for list rendering
          const { data: actor } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', newNotif.actor_id)
            .single();

          let post = null;
          if (newNotif.reference_id) {
            const { data: postData } = await supabase
              .from('posts')
              .select('slug, title')
              .eq('id', newNotif.reference_id)
              .maybeSingle();
            post = postData;
          }

          const hydratedNotification = {
            ...newNotif,
            actor,
            post
          };

          setNotifications(prev => [hydratedNotification, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new;
          setNotifications(prev => 
            prev.map(n => n.id === updated.id ? { ...n, is_read: updated.is_read } : n)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, [user, router, setUnreadNotificationsCount]);

  const handleMarkAsReadClick = async (e, notifId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
    );
    setUnreadNotificationsCount(Math.max(0, unreadCount - 1));

    await markAsRead(notifId);
    toast.success('Notification marked as read');
  };

  const handleMarkAllAsReadClick = async () => {
    if (unreadCount === 0) return;
    
    // Optimistic UI update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadNotificationsCount(0);

    const res = await markAllAsRead();
    if (res?.error) {
      toast.error('Failed to mark all as read');
    } else {
      toast.success('All notifications marked as read');
    }
  };

  const handleNotificationLinkClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
      setUnreadNotificationsCount(Math.max(0, unreadCount - 1));
    }
  };

  if (!user) return null;

  const hasUnread = unreadCount > 0;

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-0 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-primary/10 rounded-xl text-blue-primary">
            <Bell size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
        </div>

        {hasUnread && (
          <button
            onClick={handleMarkAllAsReadClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-primary hover:bg-blue-primary/5 rounded-xl border border-blue-primary/20 transition-all cursor-pointer"
          >
            <CheckCheck size={14} />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {showBanner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-primary/10 to-indigo-500/10 border border-blue-primary/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-primary/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-primary/10 transition-colors duration-500" />
          <div className="flex items-start gap-3 relative z-10">
            <div className="p-2 bg-blue-primary rounded-xl text-white shrink-0 mt-0.5 shadow-md shadow-blue-primary/20">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm sm:text-base leading-snug">
                Enable Push Notifications
              </h3>
              <p className="text-xs sm:text-sm text-text-dim mt-0.5 max-w-[400px]">
                Get real-time alerts on your device when people interact with your posts or profile.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              onClick={subscribeToPush}
              disabled={isSubscribing}
              className="px-3.5 py-1.5 bg-blue-primary hover:bg-blue-hover text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm shadow-blue-primary/10 hover:shadow-blue-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubscribing ? 'Enabling...' : 'Enable'}
            </button>
            <button
              onClick={handleDismissBanner}
              className="p-1.5 hover:bg-bg-card rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-dim animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4 text-text-muted">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">You're all caught up!</h3>
            <p className="text-text-dim">When someone interacts with you, it will show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {notifications.map((notif) => {
              const isUnread = !notif.is_read;
              
              let Icon = Bell;
              let iconColor = 'text-text-muted';
              let bgColor = 'bg-bg-elevated';
              let text = '';
              let link = '#';

              const type = notif.type;

              if (type === 'CIRCLE_ADD' || type === 'circle' || type === 'follow') {
                Icon = UserPlus;
                iconColor = 'text-accent-green';
                bgColor = 'bg-accent-green/10';
                text = 'added you to their Circle';
                link = `/profile/${notif.actor?.username}`;
              } else if (type === 'POST_COMMENT' || type === 'comment') {
                Icon = MessageSquare;
                iconColor = 'text-purple-secondary';
                bgColor = 'bg-purple-secondary/10';
                text = 'commented on your post';
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'COMMENT_REPLY') {
                Icon = MessageSquare;
                iconColor = 'text-indigo-500';
                bgColor = 'bg-indigo-500/10';
                text = 'replied to your comment';
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'POST_LIKE' || type === 'like') {
                Icon = ThumbsUp;
                iconColor = 'text-blue-primary';
                bgColor = 'bg-blue-primary/10';
                text = 'liked your post';
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'POST_REACTION') {
                Icon = Heart;
                iconColor = 'text-pink-500';
                bgColor = 'bg-pink-500/10';
                text = `reacted ${notif.content || '❤️'} to your post`;
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'POLL_VOTE') {
                Icon = BarChart3;
                iconColor = 'text-amber-500';
                bgColor = 'bg-amber-500/10';
                text = 'voted in your poll';
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'MENTION') {
                Icon = Bell;
                iconColor = 'text-teal-500';
                bgColor = 'bg-teal-500/10';
                text = 'mentioned you';
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'POST_REPORT') {
                Icon = AlertTriangle;
                iconColor = 'text-accent-red';
                bgColor = 'bg-accent-red/10';
                text = `reported a post for: ${notif.content || 'Inappropriate content'}`;
                link = `/post/${notif.post?.slug}`;
              } else if (type === 'SYSTEM') {
                Icon = Bell;
                iconColor = 'text-gray-500';
                bgColor = 'bg-gray-500/10';
                text = notif.content || 'System alert';
                link = '/notifications';
              } else if (type === 'EVENT_RSVP' || type === 'rsvp') {
                Icon = CheckCircle2;
                iconColor = 'text-accent-green';
                bgColor = 'bg-accent-green/10';
                text = 'is going to your event';
                link = `/post/${notif.post?.slug}`;
              }

              return (
                <Link 
                  key={notif.id} 
                  href={link} 
                  onClick={() => handleNotificationLinkClick(notif)}
                  className={`flex items-start justify-between gap-4 p-4 sm:p-5 hover:bg-bg-elevated transition-colors ${isUnread ? 'bg-blue-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="relative shrink-0 mt-1">
                      <Avatar 
                        src={notif.actor?.avatar_url} 
                        name={notif.actor?.display_name || 'User'} 
                        size="md" 
                      />
                      <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-bg-card ${bgColor} ${iconColor} flex items-center justify-center`}>
                        {type === 'POST_REACTION' && notif.content ? (
                          <span className="text-[9px] leading-none h-2.5 w-2.5 flex items-center justify-center font-bold">{notif.content}</span>
                        ) : (
                          <Icon size={10} strokeWidth={3} />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary leading-snug">
                        <span className="font-semibold hover:underline">
                          {notif.actor?.display_name || notif.actor?.username || 'Someone'}
                        </span>{' '}
                        <span className="text-text-muted">{text}</span>
                      </p>
                      
                      {notif.post && (
                        <p className="text-sm font-medium text-text-primary mt-0.5 truncate">
                          "{notif.post.title}"
                        </p>
                      )}
                      
                      <p className="text-xs text-text-dim mt-1.5 font-medium">
                        {timeAgo(notif.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  {isUnread && (
                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <button
                        onClick={(e) => handleMarkAsReadClick(e, notif.id)}
                        className="p-1.5 hover:bg-bg-elevated text-text-dim hover:text-blue-primary rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-primary" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
