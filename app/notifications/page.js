import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { fetchNotifications } from '@/app/actions/notifications';
import { timeAgo } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { MessageSquare, Heart, Bell, AlertCircle } from 'lucide-react';
import { generateMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  title: 'Notifications',
  description: 'See your latest interactions on Rambhahoo.',
});

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const notifications = await fetchNotifications();

  return (
    <div className="py-4 animate-fade-in max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Bell size={24} className="text-blue-primary" />
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
          Notifications
        </h1>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
              <Bell size={32} className="text-text-dim" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">You're all caught up!</h3>
            <p className="text-text-muted text-sm">
              When someone interacts with your posts or replies to your comments, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => {
              const { actor, post, type, content, is_read, created_at, id } = notif;
              
              let Icon = Bell;
              let actionText = '';
              let bgColor = 'bg-bg-elevated';
              
              if (type === 'comment') {
                Icon = MessageSquare;
                actionText = 'commented on your post';
                bgColor = 'bg-blue-primary/10 text-blue-primary';
              } else if (type === 'reaction') {
                Icon = Heart;
                actionText = `reacted ${content} to your post`;
                bgColor = 'bg-accent-red/10 text-accent-red';
              }

              return (
                <Link
                  key={id}
                  href={`/post/${post?.slug || ''}`}
                  className={`flex items-start gap-4 p-4 hover:bg-bg-card-hover transition-colors ${is_read ? 'opacity-70' : 'bg-blue-primary/5'}`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={actor?.avatar_url} name={actor?.display_name || actor?.username} size="md" />
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${bgColor} border-2 border-bg-card`}>
                      <Icon size={10} fill={type === 'reaction' ? 'currentColor' : 'none'} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm text-text-primary leading-snug">
                      <span className="font-semibold">{actor?.display_name || actor?.username}</span>{' '}
                      <span className="text-text-muted">{actionText}</span>{' '}
                      <span className="font-medium text-text-primary">"{post?.title}"</span>
                    </p>
                    {type === 'comment' && content && (
                      <p className="text-sm text-text-dim mt-1 line-clamp-2">"{content}"</p>
                    )}
                    <p className="text-xs text-text-dim mt-1.5">{timeAgo(created_at)}</p>
                  </div>
                  
                  {!is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-primary shrink-0 mt-2" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Alert about SQL script for user */}
      <div className="mt-8 p-4 bg-accent-amber/10 border border-accent-amber/30 rounded-xl flex items-start gap-3">
        <AlertCircle size={20} className="text-accent-amber shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-accent-amber text-sm">Developer Note</h4>
          <p className="text-xs text-text-muted mt-1">
            If notifications aren't appearing, ensure you have executed the `notifications.sql` script in your Supabase dashboard to create the table and triggers.
          </p>
        </div>
      </div>
    </div>
  );
}
