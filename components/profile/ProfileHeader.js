'use client';

import { useState, useTransition, useEffect } from 'react';
import { MapPin, Calendar, Link as LinkIcon, Settings, UserPlus, CheckCircle2, Edit3 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/app/actions/auth';
import { toggleCircle, checkInCircle } from '@/app/actions/circle';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileHeader({ profile, isOwnProfile = false }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isPending, startTransition] = useTransition();
  const [inCircle, setInCircle] = useState(false);
  const [followersCount, setFollowersCount] = useState(profile?.followers_count || 0);
  
  // Check circle status on mount
  useEffect(() => {
    if (!isOwnProfile && user && profile) {
      checkInCircle(profile.id).then(setInCircle);
    }
  }, [isOwnProfile, user, profile]);
  
  if (!profile) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleToggleCircle = () => {
    if (!user) return router.push('/login');
    
    // Optimistic UI update for 0ms latency
    setInCircle(!inCircle);
    setFollowersCount(prev => inCircle ? prev - 1 : prev + 1);
    
    startTransition(async () => {
      const res = await toggleCircle(profile.id);
      if (res?.error) {
        // Rollback on error
        setInCircle(!inCircle);
        setFollowersCount(prev => inCircle ? prev + 1 : prev - 1);
      }
    });
  };

  return (
    <div className="bg-bg-card rounded-3xl overflow-hidden mb-6 shadow-sm border border-border animate-fade-in">
      <div className="px-6 sm:px-10 py-10 flex flex-col items-center text-center relative">
        {/* Avatar & Main Actions */}
        <div className="relative inline-block mb-4">
          <div className="rounded-full p-1.5 bg-bg-card shadow-md relative z-10">
            <Avatar 
              src={profile.avatar_url} 
              name={profile.display_name || profile.username} 
              size="xl" 
              className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-bg-elevated object-cover" 
            />
          </div>
          {/* Online Status Indicator */}
          <div className="absolute bottom-4 right-4 w-5 h-5 bg-accent-green rounded-full border-4 border-bg-card z-20" />
        </div>
        
        {/* Profile Info Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1 justify-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            <Badge variant="primary" className="text-[10px] font-bold tracking-wider uppercase">
              {profile.city || profile.locality || 'User'}
            </Badge>
          </div>
          <p className="text-text-dim font-medium text-sm sm:text-base mb-4">@{profile.username}</p>
          
          <div className="flex gap-3 justify-center mb-6">
            {isOwnProfile ? (
              <>
                <Link href="/settings/profile">
                  <Button variant="outline" className="gap-2 rounded-full px-6 font-semibold shadow-sm hover:shadow text-text-primary">
                    <Edit3 size={18} />
                    <span>Edit Profile</span>
                  </Button>
                </Link>
                <Button variant="ghost" className="gap-2 rounded-full px-4 text-text-dim hover:text-accent-red" onClick={handleLogout}>
                  <Settings size={18} />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleToggleCircle}
                  disabled={isPending}
                  variant={inCircle ? 'outline' : 'primary'} 
                  className={`gap-2 rounded-full px-8 font-semibold shadow-sm ${inCircle ? 'text-accent-green border-accent-green/30 bg-accent-green/5' : 'shadow-blue-primary/20'}`}
                >
                  {inCircle ? <CheckCircle2 size={18} /> : <UserPlus size={18} />}
                  <span>{inCircle ? 'In My Circle' : 'Add to Circle'}</span>
                </Button>
              </>
            )}
          </div>
          
          {profile.bio && (
            <p className="mt-2 text-base text-text-muted whitespace-pre-wrap max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mt-6 text-sm text-text-muted font-medium">
            {profile.location && (
              <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-default">
                <MapPin size={16} className="text-text-dim" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1.5">
                <LinkIcon size={16} className="text-text-dim" />
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-primary hover:text-blue-hover transition-colors font-semibold hover:underline underline-offset-4">
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-default">
              <Calendar size={16} className="text-text-dim" />
              <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-6 border-t border-border-light">
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{profile.posts_count || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Posts</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-blue-primary mb-1">{profile.reputation_score || profile.karma || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Reputation</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{followersCount}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Circled By</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{profile.following_count || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">In My Circle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
