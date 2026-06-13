'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, MapPin, Users, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';
import Button from '@/components/ui/Button';
import { toggleRsvp, getRsvpStatus } from '@/app/actions/events';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

export default function EventCard({ post }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Handle nested events array since supabase join returns an array
  const eventDetails = Array.isArray(post.events) ? post.events[0] : post.events;
  
  const eventDate = eventDetails?.event_date ? new Date(eventDetails.event_date) : null;
  const isPast = eventDate ? eventDate < new Date() : false;

  useEffect(() => {
    if (user && post.id) {
      getRsvpStatus(post.id).then(setRsvpStatus);
    }
  }, [user, post.id]);

  const handleRsvp = (status) => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    const previousStatus = rsvpStatus;
    setRsvpStatus(rsvpStatus === status ? null : status);
    
    startTransition(async () => {
      const res = await toggleRsvp(post.id, status);
      if (res?.error) {
        setRsvpStatus(previousStatus);
      }
    });
  };

  return (
    <article className="bg-bg-card rounded-3xl border border-border overflow-hidden hover:border-border-light transition-colors duration-300 shadow-sm">
      <PostHeader post={post} />
      
      <Link href={`/post/${post.slug}`} className="block px-4 sm:px-5 pb-3">
        <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-2 line-clamp-2 leading-tight">
          {post.title}
        </h2>
        
        {post.content && (
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
            {post.content}
          </p>
        )}

        <div className="bg-bg-elevated/50 rounded-2xl p-4 sm:p-5 border border-border/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-primary/10 flex flex-col items-center justify-center text-blue-primary shrink-0 shadow-sm border border-blue-primary/20">
              <span className="text-[10px] uppercase font-bold tracking-wider leading-none mb-0.5">
                {eventDate ? eventDate.toLocaleString('en-US', { month: 'short' }) : 'TBD'}
              </span>
              <span className="text-xl font-black leading-none">
                {eventDate ? eventDate.getDate() : '?'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-text-primary">
                {eventDate ? eventDate.toLocaleString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' }) : 'Date to be announced'}
              </span>
              {isPast && <span className="text-xs font-bold text-accent-red uppercase tracking-wider">Past Event</span>}
            </div>
          </div>

          {(eventDetails?.location_name || post.locality_id) && (
            <div className="flex items-center gap-2 text-text-muted text-sm mt-1">
              <MapPin size={16} className="text-text-dim shrink-0" />
              <span className="truncate font-medium">{eventDetails?.location_name || 'In your neighborhood'}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Users size={16} className="text-text-dim shrink-0" />
            <span className="font-medium">{eventDetails?.rsvp_count || 0} attending</span>
          </div>
        </div>
      </Link>
      
      {!isPast && (
        <div className="px-4 sm:px-5 pb-4 pt-1 flex gap-2">
          <Button 
            onClick={() => handleRsvp('going')} 
            disabled={isPending}
            variant={rsvpStatus === 'going' ? 'primary' : 'outline'}
            className={`flex-1 rounded-xl h-10 ${rsvpStatus === 'going' ? 'bg-accent-green hover:bg-accent-green/90 border-accent-green text-white shadow-sm shadow-accent-green/20' : 'hover:bg-accent-green/10 hover:text-accent-green hover:border-accent-green/30'}`}
          >
            <CheckCircle2 size={16} className={rsvpStatus === 'going' ? 'text-white' : ''} /> Going
          </Button>
          <Button 
            onClick={() => handleRsvp('maybe')} 
            disabled={isPending}
            variant={rsvpStatus === 'maybe' ? 'primary' : 'outline'}
            className={`flex-1 rounded-xl h-10 ${rsvpStatus === 'maybe' ? 'bg-accent-amber hover:bg-accent-amber/90 border-accent-amber text-white shadow-sm shadow-accent-amber/20' : 'hover:bg-accent-amber/10 hover:text-accent-amber hover:border-accent-amber/30'}`}
          >
            <HelpCircle size={16} className={rsvpStatus === 'maybe' ? 'text-white' : ''} /> Maybe
          </Button>
        </div>
      )}

      <div className="px-4 sm:px-5 pb-4 pt-2">
        <PostFooter post={post} />
      </div>
    </article>
  );
}
