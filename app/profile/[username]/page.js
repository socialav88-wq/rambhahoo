import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PostCard from '@/components/feed/PostCard';
import { generateProfileMetadata } from '@/lib/seo';
import { fetchUserProfile, fetchUserPosts } from '@/app/actions/profile';
import { Flame } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { username } = await params;
  const profile = await fetchUserProfile(username);
  
  if (!profile) return { title: 'User not found' };

  return generateProfileMetadata({
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
  });
}

export default async function ProfilePage({ params }) {
  const { username } = await params;
  const supabase = await createClient();

  const profile = await fetchUserProfile(username);
  if (!profile) {
    notFound();
  }

  // Check if this is the current user's own profile
  const { data: { user } } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;

  const posts = await fetchUserPosts(profile.id);

  return (
    <div className="animate-fade-in py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: profile.display_name || profile.username,
            alternateName: profile.username,
            description: profile.bio || '',
            url: `https://www.rambhahoo.com/profile/${profile.username}`
          })
        }}
      />
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />
      <div className="mt-8">
        <div className="border-b border-border flex gap-6 mb-6 px-4 sm:px-0">
          <button className="pb-3 border-b-2 border-blue-primary text-text-primary font-medium text-sm">
            Posts ({profile.posts_count})
          </button>
          <button className="pb-3 border-b-2 border-transparent text-text-dim hover:text-text-primary font-medium text-sm transition-colors cursor-not-allowed" title="Coming soon">
            Comments ({profile.comments_count})
          </button>
        </div>
        
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-xl border border-border border-dashed text-center shadow-sm">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
              <Flame size={32} className="text-text-dim" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No posts yet</h3>
            <p className="text-text-muted text-sm">
              {isOwnProfile ? "You haven't posted anything yet." : `@${username} hasn't posted anything yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
