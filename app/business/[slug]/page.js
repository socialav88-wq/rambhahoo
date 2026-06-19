import { fetchBusinessBySlug, fetchBusinessRelatedPosts } from '@/app/actions/posts';
import { generateBusinessMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import PostCard from '@/components/feed/PostCard';
import { Star, MapPin, Building2, Tag, ArrowRight, MessageSquarePlus } from 'lucide-react';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const business = await fetchBusinessBySlug(slug);
  
  if (!business) {
    return {
      title: 'Business Not Found | Rambhahoo',
      robots: {
        index: false,
        follow: false,
      }
    };
  }

  return generateBusinessMetadata(business, business.localities);
}

export default async function BusinessPage({ params }) {
  const { slug } = await params;
  const business = await fetchBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const relatedPosts = await fetchBusinessRelatedPosts(business.name, business.tags);

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    image: business.image_url || 'https://www.rambhahoo.com/og-default.png',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: business.localities?.name || 'Hyderabad',
      addressRegion: 'Telangana',
      addressCountry: 'IN'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: business.rating || 4.5,
      reviewCount: 15,
      bestRating: 5,
      worstRating: 1
    }
  };

  return (
    <div className="animate-fade-in py-2">
      <Breadcrumbs 
        items={[
          ...(business.localities ? [{ label: `${business.localities.name} Community`, href: `/${business.localities.slug}` }] : []),
          { label: business.name, href: `/business/${business.slug}` }
        ]} 
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Left Column: Business Card Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            {/* Background Accent glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl select-none" />

            {/* Category / Icon Panel */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20 select-none">
                <Building2 size={28} />
              </div>
              
              {business.rating && (
                <div className="flex items-center gap-1 bg-amber-500/10 text-accent-amber px-3 py-1 rounded-xl text-sm font-bold border border-amber-500/20 shadow-sm">
                  <Star size={14} className="fill-current" />
                  <span>{Number(business.rating).toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title & Category */}
            <div className="mb-4 relative z-10">
              <span className="text-[10px] bg-bg-elevated text-text-dim px-2.5 py-1 rounded-md font-bold uppercase tracking-wider select-none">
                {business.category}
              </span>
              <h1 className="text-2xl font-extrabold text-text-primary mt-2 font-[family-name:var(--font-poppins)]">
                {business.name}
              </h1>
            </div>

            {/* Description */}
            <p className="text-sm text-text-muted leading-relaxed mb-6 border-b border-border/50 pb-5 relative z-10">
              {business.description || 'No description provided for this business yet.'}
            </p>

            {/* Location & Tags details */}
            <div className="space-y-4 relative z-10 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-blue-primary mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-text-primary block">Locality</span>
                  {business.localities ? (
                    <Link 
                      href={`/${business.localities.slug}`} 
                      className="text-xs text-blue-primary hover:underline font-semibold flex items-center gap-1 mt-0.5"
                    >
                      <span>{business.localities.emoji}</span>
                      <span>{business.localities.name}</span>
                      <ArrowRight size={12} />
                    </Link>
                  ) : (
                    <span className="text-xs text-text-muted">Hyderabad, Telangana</span>
                  )}
                </div>
              </div>

              {business.tags && business.tags.length > 0 && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-border/30">
                  <Tag size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-text-primary block mb-1.5">Business Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {business.tags.map(t => (
                        <Link
                          key={t}
                          href={`/search?q=${encodeURIComponent(t)}`}
                          className="text-[10px] bg-bg-elevated hover:bg-bg-elevated-hover text-text-dim hover:text-text-primary px-2.5 py-1 rounded-lg font-bold transition-all"
                        >
                          #{t}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Related Neighborhood Posts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <h2 className="font-bold text-lg text-text-primary font-[family-name:var(--font-poppins)]">
              Neighborhood Buzz about {business.name}
            </h2>
          </div>

          {relatedPosts.length > 0 ? (
            <div className="space-y-4">
              {relatedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-bg-card rounded-3xl border border-border border-dashed text-center">
              <div className="w-14 h-14 bg-bg-elevated rounded-2xl flex items-center justify-center mb-4 text-text-dim border border-border/50">
                <MessageSquarePlus size={26} className="text-text-muted" />
              </div>
              <h3 className="font-bold text-text-primary text-sm mb-1.5">No posts yet</h3>
              <p className="text-xs text-text-muted max-w-xs leading-relaxed mb-6">
                Nobody has discussed this business yet in their locality feeds. Start the discussion!
              </p>
              
              <Link href={`/create?title=${encodeURIComponent('Review of ' + business.name)}&category=recommendation`}>
                <Button variant="primary" size="sm" className="rounded-xl font-bold flex items-center gap-2">
                  <span>Write a post</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
