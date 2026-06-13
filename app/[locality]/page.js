import { notFound } from 'next/navigation';
import FeedContainer from '@/components/feed/FeedContainer';
import LocalityHeader from '@/components/locality/LocalityHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getLocalityBySlug, isValidLocality } from '@/lib/utils';
import { generateLocalityMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

export async function generateMetadata({ params }) {
  const { locality: slug } = await params;
  const locality = getLocalityBySlug(slug);
  if (!locality) return {};
  return generateLocalityMetadata(locality);
}

export default async function LocalityPage({ params }) {
  const { locality: slug } = await params;
  
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
      <div className="mt-6">
        <FeedContainer localitySlug={slug} />
      </div>
    </div>
  );
}
