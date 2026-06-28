import { createClient } from '@/lib/supabase/server';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default async function Leaderboard() {
  const supabase = await createClient();
  
  // Fetch top 5 profiles by reputation
  const { data: topProfiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, reputation_score, locality:localities(name)')
    .order('reputation_score', { ascending: false })
    .limit(5);

  if (!topProfiles || topProfiles.length === 0) return null;

  return (
    <div className="bg-bg-card border border-border rounded-2xl shadow-sm p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent-amber/10 rounded-lg text-accent-amber">
          <Trophy size={20} />
        </div>
        <h2 className="text-lg font-bold text-text-primary font-[family-name:var(--font-poppins)]">
          Top Neighbors
        </h2>
      </div>
      <p className="text-xs text-text-dim mb-4">Users with the highest reputation from local interactions.</p>

      <div className="flex flex-col gap-3">
        {topProfiles.map((profile, idx) => (
          <Link key={profile.id} href={`/profile/${profile.username}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-elevated transition-colors group">
            <div className="font-bold text-lg w-4 text-center text-text-dim group-hover:text-blue-primary">
              {idx + 1}
            </div>
            <Avatar src={profile.avatar_url} name={profile.display_name} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-text-primary group-hover:text-blue-primary transition-colors">
                  {profile.display_name || profile.username}
                </span>
                <span className="text-xs text-text-muted font-normal">
                  @{profile.username}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <Badge variant="primary" className="bg-blue-primary/10 text-blue-primary border-0 font-bold px-2 py-0.5">
                {profile.reputation_score || 0} pts
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
