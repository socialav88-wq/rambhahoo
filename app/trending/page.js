import TrendingTopics from '@/components/trending/TrendingTopics';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  title: 'Trending Discussions Near You',
  description: 'See what everyone in Hyderabad is talking about right now.',
});

export default function TrendingPage() {
  return (
    <div className="py-4">
      <div className="mb-6 lg:hidden">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary">
          Trending
        </h1>
        <p className="text-text-muted text-sm">Hot topics in Hyderabad right now</p>
      </div>
      <TrendingTopics />
    </div>
  );
}
