import Link from 'next/link';
import { TrendingUp, MapPin } from 'lucide-react';
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
    </div>
  );
}
