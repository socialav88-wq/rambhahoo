'use client';

import { MapPin, Calendar, Link as LinkIcon, Settings, UserPlus, Mail } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function ProfileHeader({ profile, isOwnProfile = false }) {
  const router = useRouter();
  
  if (!profile) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="bg-bg-card rounded-3xl overflow-hidden mb-6 shadow-sm border border-border">
      {/* Premium Cover Photo with Mesh Gradient */}
      <div className="h-40 sm:h-56 bg-gradient-to-br from-blue-primary via-purple-secondary to-accent-amber relative overflow-hidden">
        {/* Abstract overlay patterns */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
      
      <div className="px-6 sm:px-10 pb-8 relative">
        {/* Avatar & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 -mt-16 sm:-mt-20 mb-6">
          <div className="relative inline-block">
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
          
          <div className="flex gap-3 mt-2 sm:mt-0">
            {isOwnProfile ? (
              <Button variant="outline" className="gap-2 rounded-full px-6 font-semibold shadow-sm hover:shadow" onClick={handleLogout}>
                <Settings size={18} />
                <span>Log Out</span>
              </Button>
            ) : (
              <>
                <Button variant="outline" className="rounded-full px-4 text-text-dim hover:text-text-primary">
                  <Mail size={18} />
                </Button>
                <Button variant="primary" className="gap-2 rounded-full px-8 font-semibold shadow-md shadow-blue-primary/20">
                  <UserPlus size={18} />
                  <span>Follow</span>
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Profile Info Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {profile.display_name || profile.username}
            </h1>
            <Badge variant="primary" className="text-[10px] font-bold tracking-wider uppercase">
              {profile.city || profile.locality || 'User'}
            </Badge>
          </div>
          <p className="text-text-dim font-medium text-sm sm:text-base">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-4 text-base text-text-muted whitespace-pre-wrap max-w-3xl leading-relaxed">
              {profile.bio}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-sm text-text-muted font-medium">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border-light">
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{profile.posts_count || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Posts</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-blue-primary mb-1">{profile.reputation_score || profile.karma || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Reputation</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{profile.followers_count || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Followers</span>
          </div>
          <div className="bg-bg-elevated/50 rounded-2xl p-4 text-center hover:bg-bg-elevated transition-colors cursor-pointer">
            <span className="block font-black text-2xl text-text-primary mb-1">{profile.following_count || 0}</span>
            <span className="text-xs font-semibold text-text-dim uppercase tracking-wider">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
}
