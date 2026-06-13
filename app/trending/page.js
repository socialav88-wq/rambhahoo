import TrendingTopics from '@/components/trending/TrendingTopics';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { generateMetadata } from '@/lib/seo';

export const metadata = generateMetadata({
  exactTitle: 'Trending Local Discussions & Updates | Rambhahoo',
  description: 'Discover trending local discussions, community discussions, and real-time local updates happening in your neighborhood on Rambhahoo.',
});

export default function TrendingPage() {
  return (
    <div className="py-2 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Trending', href: '/trending' }]} />
      <div className="mb-6 border-b border-border pb-4 mt-2">
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary tracking-tight">
          Trending Local Discussions
        </h1>
        <h2 className="text-text-muted text-sm md:text-base mt-1.5 leading-snug">
          Explore the hottest community discussions and local updates in your area.
        </h2>
      </div>
      <TrendingTopics />
    </div>
  );
}
