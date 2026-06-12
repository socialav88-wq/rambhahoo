import FeedContainer from '@/components/feed/FeedContainer';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Rambhahoo | Hyderabad\'s Local Network',
  description: 'Join the conversation in Hyderabad. Local news, discussions, memes, and more.',
});

export default function Home() {
  return (
    <div className="animate-fade-in">
      <div className="mb-4 md:hidden">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
          Your Feed
        </h1>
        <p className="text-text-muted text-sm">See what's happening around you</p>
      </div>
      <FeedContainer />
    </div>
  );
}
