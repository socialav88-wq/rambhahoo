'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RealtimeProvider({ children }) {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Listen to new notifications directed to the current user
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const notif = payload.new;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', notif.actor_id)
            .single();

          const name = sender?.display_name || sender?.username || 'Someone';

          let message = '';
          let icon = '🔔';

          if (notif.type === 'circle') {
            message = `${name} added you to their circle!`;
            icon = '🤝';
          } else if (notif.type === 'comment') {
            message = `${name} commented on your post!`;
            icon = '💬';
          } else if (notif.type === 'like') {
            message = `${name} reacted to your post!`;
            icon = '❤️';
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

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [user]);

  return <>{children}</>;
}
