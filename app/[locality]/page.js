import { notFound } from 'next/navigation';
import FeedContainer from '@/components/feed/FeedContainer';
import LocalityHeader from '@/components/locality/LocalityHeader';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getLocalityBySlug, isValidLocality } from '@/lib/utils';
import { generateLocalityMetadata } from '@/lib/seo';

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

  return (
    <div className="animate-fade-in py-2">
      <Breadcrumbs items={[{ label: `${locality.name} Community`, href: `/${locality.slug}` }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Place',
            name: `${locality.name}, Hyderabad`,
            description: locality.description,
            url: `https://www.rambhahoo.com/${locality.slug}`
          })
        }}
      />
      <LocalityHeader locality={locality} />
      <div className="mt-6">
        <FeedContainer localitySlug={slug} />
      </div>
    </div>
  );
}
