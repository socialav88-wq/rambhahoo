import FeedContainer from '@/components/feed/FeedContainer';
import { generateMetadata } from '@/lib/seo';
import { fetchFeeds } from '@/app/actions/posts';

export const metadata = generateMetadata({
  exactTitle: 'Rambhahoo - The Local Social Network & Community Platform',
  description: 'Discover what\'s happening near you on Rambhahoo. The premier neighborhood social network and local community platform for Hyderabad discussions and local events near me.',
});

export const dynamic = 'force-dynamic';

export default async function Home() {
  const initialPosts = await fetchFeeds('new');

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-border pb-4">
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary tracking-tight">
          Hyderabad's Hyperlocal Social Network
        </h1>
        <h2 className="text-text-muted text-sm md:text-base mt-1.5 leading-snug">
          Your neighborhood social network and local community platform for real-time discussions, news, and updates.
        </h2>
      </div>
      <FeedContainer initialPosts={initialPosts} />
    </div>
  );
}
