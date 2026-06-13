import FeedContainer from '@/components/feed/FeedContainer';
import { generateMetadata } from '@/lib/seo';
import { fetchFeeds } from '@/app/actions/posts';

export const metadata = generateMetadata({
  exactTitle: 'Rambhahoo - Local Social Network and Community Platform',
  description: 'Join the conversation in Hyderabad. Local news, discussions, memes, and more.',
});

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialPosts = await fetchFeeds('new');

  return (
    <div className="animate-fade-in">
      <div className="mb-4 md:hidden">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
          Your Feed
        </h1>
        <p className="text-text-muted text-sm">See what's happening around you</p>
      </div>
      <FeedContainer initialPosts={initialPosts} />
    </div>
  );
}
