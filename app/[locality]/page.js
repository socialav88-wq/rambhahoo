import { notFound } from 'next/navigation';
import FeedContainer from '@/components/feed/FeedContainer';
import LocalityHeader from '@/components/locality/LocalityHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getLocalityBySlug, isValidLocality } from '@/lib/utils';
import { generateLocalityMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { locality: slug } = await params;
  const locality = getLocalityBySlug(slug);
  if (!locality) return {};
  return generateLocalityMetadata(locality);
}

export default async function LocalityPage({ params, searchParams }) {
  const { locality: slug } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || 'discussions';
  
  if (!isValidLocality(slug)) {
    notFound();
  }

  const locality = getLocalityBySlug(slug);
  const supabase = await createClient();
  const { data: dbLoc } = await supabase.from('localities').select('id, member_count').eq('slug', slug).single();
  
  const enhancedLocality = {
    ...locality,
    id: dbLoc?.id,
    member_count: dbLoc?.member_count || 1
  };

  const tabs = [
    { id: 'discussions', label: '💬 Discussions', category: 'discussion' },
    { id: 'recommendations', label: '👍 Recommendations', category: 'recommendation' },
    { id: 'questions', label: '❓ Questions', category: 'question' },
    { id: 'news', label: '📰 Civic News', category: 'news' },
    { id: 'events', label: '📅 Events', category: 'event' },
    { id: 'trending', label: '🔥 Trending', category: 'trending' }
  ];

  const selectedTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];
  const currentCategory = selectedTabObj.category;

  return (
    <div className="animate-fade-in py-2">
      <Breadcrumbs items={[{ label: `${enhancedLocality.name} Community`, href: `/${enhancedLocality.slug}` }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: `${enhancedLocality.name}, Hyderabad`,
            description: enhancedLocality.description,
            url: `https://www.rambhahoo.com/${enhancedLocality.slug}`
          })
        }}
      />
      <LocalityHeader locality={enhancedLocality} />
      
      {/* Horizontal Crawl Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 border-b border-border mt-5 mb-4 scrollbar-none">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={`/${slug}?tab=${t.id}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all border ${
                isActive
                  ? 'bg-blue-primary border-blue-primary text-white shadow-sm'
                  : 'bg-bg-elevated border-border text-text-muted hover:text-text-primary hover:border-border-light'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2">
        <FeedContainer localitySlug={slug} category={currentCategory} />
      </div>
    </div>
  );
}
