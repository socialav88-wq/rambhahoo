import Link from 'next/link';
import { TrendingUp, MessageSquare, Flame } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { fetchTrendingTags, fetchHotDiscussions, fetchActivePolls } from '@/app/actions/posts';

export default async function RightSidebar() {
  const [trendingTags, hotDiscussions, activePolls] = await Promise.all([
    fetchTrendingTags(),
    fetchHotDiscussions(),
    fetchActivePolls()
  ]);

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-[72px] space-y-4 pb-8 max-h-[calc(100vh-72px)] overflow-y-auto no-scrollbar">
        {/* Trending Topics */}
        {trendingTags.length > 0 && (
          <div className="bg-bg-card rounded-xl border border-border shadow-sm p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-accent-amber" />
              <h3 className="font-semibold text-sm text-text-primary font-[family-name:var(--font-poppins)]">Trending Now</h3>
            </div>
            <div className="space-y-3">
              {trendingTags.slice(0, 5).map((topic, i) => (
                <Link
                  key={topic.tag}
                  href={`/search?q=${topic.tag}`}
                  className="flex items-center justify-between group hover:bg-bg-card-hover rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary group-hover:text-blue-primary transition-colors">
                      #{topic.tag}
                    </p>
                  </div>
                  <Badge variant={i < 3 ? 'trending' : 'default'} className="text-[10px]">
                    {topic.label}
                  </Badge>
                </Link>
              ))}
            </div>
            <Link
              href="/trending"
              className="block mt-3 text-xs text-blue-primary hover:text-blue-hover font-medium text-center"
            >
              Show more →
            </Link>
          </div>
        )}

        {/* Hot Discussions */}
        {hotDiscussions.length > 0 && (
          <div className="bg-bg-card rounded-xl border border-border shadow-sm p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-accent-red" />
              <h3 className="font-semibold text-sm text-text-primary font-[family-name:var(--font-poppins)]">Hot Discussions</h3>
            </div>
            <div className="space-y-2">
              {hotDiscussions.map((disc) => (
                <Link
                  key={disc.slug}
                  href={`/post/${disc.slug}`}
                  className="block p-2 rounded-lg hover:bg-bg-card-hover transition-colors -mx-1"
                >
                  <p className="text-sm text-text-primary leading-snug">{disc.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MessageSquare size={12} className="text-text-dim" />
                    <span className="text-xs text-text-dim">{disc.comments || 0} comments</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Polls */}
        {activePolls.length > 0 && (
          <div className="bg-bg-card rounded-xl border border-border shadow-sm p-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📊</span>
              <h3 className="font-semibold text-sm text-text-primary font-[family-name:var(--font-poppins)]">Active Polls</h3>
            </div>
            <div className="space-y-2">
              {activePolls.map((poll) => (
                <Link
                  key={poll.slug}
                  href={`/post/${poll.slug}`}
                  className="block p-2 rounded-lg hover:bg-bg-card-hover transition-colors -mx-1"
                >
                  <p className="text-sm text-text-primary">{poll.question}</p>
                  <p className="text-xs text-text-dim mt-1">🗳️ {poll.votes || 0} votes</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* App download CTA */}
        <div className="bg-gradient-to-br from-blue-primary/5 to-purple-secondary/5 rounded-xl border border-border shadow-sm p-4 text-center">
          <p className="text-sm font-medium text-text-primary">📱 Get the Rambhahoo app</p>
          <p className="text-xs text-text-muted mt-1">Install for the best experience</p>
        </div>
      </div>
    </aside>
  );
}
