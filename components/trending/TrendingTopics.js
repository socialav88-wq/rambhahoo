import Link from 'next/link';
import { TrendingUp, MapPin } from 'lucide-react';
import { LOCALITIES } from '@/lib/constants';
import { fetchTrendingTags } from '@/app/actions/posts';

export default async function TrendingTopics() {
  const trendingTags = await fetchTrendingTags();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Trending Tags */}
      {trendingTags.length > 0 && (
        <div className="bg-bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={24} className="text-accent-amber" />
            <h2 className="text-xl font-bold text-text-primary font-[family-name:var(--font-poppins)]">
              Trending Tags
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingTags.map((topic, index) => (
              <Link 
                key={topic.tag} 
                href={`/search?q=${topic.tag}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-elevated transition-colors border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-text-dim w-6 text-center">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary text-base">
                      {topic.tag}
                    </h3>
                    <p className="text-xs text-text-dim mt-0.5">
                      Trending 🔥
                    </p>
                  </div>
                </div>
                {topic.trend === 'up' && <TrendingUp size={16} className="text-accent-green" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending Localities */}
      <div className="bg-bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={24} className="text-blue-primary" />
          <h2 className="text-xl font-bold text-text-primary font-[family-name:var(--font-poppins)]">
            Active Localities
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {LOCALITIES.slice(0, 8).map((locality) => (
            <Link 
              key={locality.slug} 
              href={`/${locality.slug}`}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-border hover:border-blue-primary/50 hover:bg-bg-elevated hover:shadow-sm transition-all text-center group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {locality.emoji}
              </span>
              <h3 className="text-sm font-medium text-text-primary">
                {locality.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
