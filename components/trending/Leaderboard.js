'use client';

import { useState, useEffect } from 'react';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { Trophy, X, UserPlus, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useFollowing } from '@/hooks/useFollowing';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const { toggleFollow, isFollowingUser } = useFollowing();
  const [topProfiles, setTopProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, reputation_score, locality:localities(name)')
          .order('reputation_score', { ascending: false })
          .limit(10);
        
        if (data) {
          // Filter out the current user so they don't see themselves in suggestions
          const filtered = data.filter(p => p.id !== user?.id);
          setTopProfiles(filtered);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleDismiss = (id) => {
    setTopProfiles(prev => prev.filter(p => p.id !== id));
  };

  const handleFollowClick = (e, profile) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    toggleFollow(profile.id, profile.display_name || profile.username);
  };

  if (loading) {
    return (
      <div className="bg-[#0b132b] border border-[#1c2541] rounded-3xl p-6 shadow-lg animate-pulse w-full mb-6">
        <div className="h-6 w-32 bg-[#1c2541] rounded-lg mb-6" />
        <div className="flex gap-4 overflow-x-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-[180px] h-[220px] bg-[#1c2541] rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (topProfiles.length === 0) return null;

  return (
    <div className="bg-[#0b132b] border border-[#1c2541] rounded-3xl p-5 md:p-6 shadow-lg w-full animate-fade-in mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-amber/15 rounded-lg text-accent-amber">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-white font-[family-name:var(--font-poppins)] tracking-tight">
              Top Neighbors
            </h2>
            <p className="text-[11px] text-blue-200/50 mt-0.5 hidden sm:block">Suggested active members in your area</p>
          </div>
        </div>
        <Link href="/search" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">
          See all
        </Link>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth w-full snap-x">
          {topProfiles.map((profile) => {
            const following = isFollowingUser(profile.id);
            return (
              <div
                key={profile.id}
                className="w-[170px] sm:w-[190px] bg-[#1c2541] border border-[#3a506b]/20 rounded-2xl p-4 flex flex-col items-center text-center shadow-md relative shrink-0 snap-start transition-all hover:border-[#3a506b]/50 group"
              >
                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(profile.id)}
                  aria-label="Dismiss suggestion"
                  className="absolute top-2.5 right-2.5 p-1 rounded-full text-blue-200/40 hover:text-white hover:bg-[#0b132b]/40 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>

                {/* Avatar container */}
                <Link href={`/profile/${profile.username}`} className="mt-2 block hover:scale-105 transition-transform">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-[#3a506b]/50 flex items-center justify-center p-0.5 bg-[#0b132b]">
                    <Avatar src={profile.avatar_url} name={profile.display_name} size="lg" className="w-full h-full rounded-full object-cover" />
                  </div>
                </Link>

                {/* Name & Username */}
                <div className="mt-3 w-full">
                  <Link href={`/profile/${profile.username}`} className="block">
                    <h4 className="text-white text-xs sm:text-sm font-bold truncate hover:text-blue-400 transition-colors">
                      {profile.display_name || profile.username}
                    </h4>
                  </Link>
                  <span className="text-[10px] text-blue-200/50 block mt-0.5 truncate">
                    @{profile.username}
                  </span>
                </div>

                {/* Subtext info (reputation & locality) */}
                <div className="flex items-center gap-1 mt-2 mb-4 text-[10px] text-blue-200/60 font-semibold bg-[#0b132b]/40 px-2 py-0.5 rounded-full border border-[#3a506b]/10">
                  <span>🏆</span>
                  <span>{profile.reputation_score || 0} pts</span>
                  {profile.locality && (
                    <>
                      <span className="text-blue-200/20">•</span>
                      <span className="truncate max-w-[60px]" title={profile.locality.name}>
                        {profile.locality.name}
                      </span>
                    </>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={(e) => handleFollowClick(e, profile)}
                  className={cn(
                    "w-full py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1",
                    following
                      ? "bg-[#3a506b]/50 hover:bg-[#3a506b]/75 text-blue-100 border border-[#3a506b]/30"
                      : "bg-blue-primary hover:bg-blue-hover text-white shadow-blue-primary/10 hover:shadow-md"
                  )}
                >
                  {following ? (
                    <>
                      <UserCheck size={12} />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={12} />
                      <span>Add to circle</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
