'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { Bell, UserPlus, MessageSquare, Heart, BarChart3, CheckCircle2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (username, display_name, avatar_url),
          post:post_id (slug, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
        
        // Mark all as read
        const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
          supabase.from('notifications').update({ is_read: true }).in('id', unreadIds).then();
        }
      }
      setLoading(false);
    };

    fetchNotifications();
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-0 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-primary/10 rounded-xl text-blue-primary">
          <Bell size={24} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Notifications</h1>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-dim">Loading notifications...</div>
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

              if (notif.type === 'follow') {
                Icon = UserPlus;
                iconColor = 'text-accent-green';
                bgColor = 'bg-accent-green/10';
                text = 'added you to their circle.';
                link = `/profile/${notif.actor?.username}`;
              } else if (notif.type === 'comment') {
                Icon = MessageSquare;
                iconColor = 'text-blue-primary';
                bgColor = 'bg-blue-primary/10';
                text = 'commented on your post:';
                link = `/post/${notif.post?.slug}`;
              } else if (notif.type === 'like') {
                Icon = Heart;
                iconColor = 'text-accent-red';
                bgColor = 'bg-accent-red/10';
                text = 'reacted to your post:';
                link = `/post/${notif.post?.slug}`;
              }

              return (
                <Link key={notif.id} href={link} className={`flex items-start gap-4 p-4 sm:p-5 hover:bg-bg-elevated transition-colors ${isUnread ? 'bg-blue-primary/5' : ''}`}>
                  <div className="relative shrink-0 mt-1">
                    <Avatar 
                      src={notif.actor?.avatar_url} 
                      name={notif.actor?.display_name || 'User'} 
                      size="md" 
                    />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full border-2 border-bg-card ${bgColor} ${iconColor}`}>
                      <Icon size={10} strokeWidth={3} />
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
                  
                  {isUnread && (
                    <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-primary mt-2" />
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
