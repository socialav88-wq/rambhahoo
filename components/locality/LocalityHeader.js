'use client';

import { useState } from 'react';
import { Users, Activity } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { joinLocality } from '@/app/actions/profile';
import { formatNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function LocalityHeader({ locality }) {
  const { user, profile } = useAuthStore();
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  if (!locality) return null;

  const isMember = profile?.locality_id === locality.id;

  const handleJoin = async () => {
    if (!user) return router.push('/login');
    if (isMember) return;
    setIsJoining(true);
    const res = await joinLocality(locality.id);
    if (res?.success) {
      // Optimistic update of auth store profile
      useAuthStore.getState().setProfile({ ...profile, locality_id: locality.id });
    } else {
      alert('Failed to join locality');
    }
    setIsJoining(false);
  };

  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 mb-6 relative overflow-hidden shadow-sm">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl pointer-events-none select-none">
        {locality.emoji}
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{locality.emoji}</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary font-[family-name:var(--font-poppins)]">
                {locality.name} Community & Neighborhood Updates
              </h1>
            </div>
            <h2 className="text-blue-primary font-medium text-sm mb-2">
              Recent {locality.name} Events & Local Discussions - {locality.tagline}
            </h2>
            <p className="text-text-muted text-sm max-w-xl leading-relaxed">
              {locality.description}
            </p>
          </div>
          
          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <Button 
              className="w-full sm:w-auto" 
              onClick={handleJoin} 
              disabled={isMember || isJoining}
              loading={isJoining}
              variant={isMember ? 'outline' : 'primary'}
            >
              {isMember ? 'Joined' : 'Join Locality'}
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-primary/10 text-blue-primary">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{formatNumber(locality.member_count || 1)}</p>
              <p className="text-xs text-text-dim">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent-green/10 text-accent-green">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">High</p>
              <p className="text-xs text-text-dim">Activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
