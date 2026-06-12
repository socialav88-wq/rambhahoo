'use client';

import { MapPin, Calendar, Link as LinkIcon, Settings } from 'lucide-react';
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
    <div className="bg-bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
      {/* Cover Photo */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-primary/10 via-bg-elevated to-purple-secondary/10 relative">
        {/* Placeholder for cover image if we add it later */}
      </div>
      
      <div className="px-4 sm:px-6 pb-6 relative">
        {/* Avatar & Actions */}
        <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
          <div className="rounded-full p-1 bg-bg-card shadow-sm">
            <Avatar 
              src={profile.avatar_url} 
              name={profile.display_name || profile.username} 
              size="xl" 
              className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-bg-card" 
            />
          </div>
          
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                <Settings size={16} />
                <span className="hidden sm:inline">Log Out</span>
              </Button>
            ) : (
              <Button size="sm">Follow</Button>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-text-muted mt-0.5">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-3 text-sm text-text-primary whitespace-pre-wrap max-w-2xl leading-relaxed">
              {profile.bio}
            </p>
          )}
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-dim">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-1">
                <LinkIcon size={14} />
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-primary hover:underline">
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>Joined {new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          
          {/* Badges/Stats */}
          <div className="flex gap-4 mt-5 pt-5 border-t border-border">
            <div className="text-center">
              <span className="block font-bold text-lg text-text-primary">{profile.posts_count || 0}</span>
              <span className="text-xs text-text-muted">Posts</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-lg text-text-primary">{profile.reputation_score || profile.karma || 0}</span>
              <span className="text-xs text-text-muted">Reputation</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-lg text-text-primary">{profile.followers_count || 0}</span>
              <span className="text-xs text-text-muted">Followers</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-lg text-text-primary">{profile.following_count || 0}</span>
              <span className="text-xs text-text-muted">Following</span>
            </div>
            <div className="flex items-center ml-auto">
              <Badge variant="primary" className="text-xs">
                {profile.city || profile.locality || 'Rambhahoo User'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
