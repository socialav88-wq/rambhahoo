import SearchBar from '@/components/trending/SearchBar';
import SearchTabs from '@/components/search/SearchTabs';
import { generateMetadata } from '@/lib/seo';
import { searchPosts, fetchTrendingTags, fetchActiveLocalities, fetchFeeds } from '@/app/actions/posts';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  exactTitle: 'Search Communities & Local Discussions | Rambhahoo',
  description: 'Search communities, discover local communities, and search local discussions happening right now on Rambhahoo.',
});

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';
  
  // Fetch search results if query exists
  let results = { posts: [], users: [], localities: [], businesses: [], tags: [] };
  if (query) {
    results = await searchPosts(query);
  }

  // Load baseline recommendation data in parallel for the fallback/empty state
  const [trendingTags, activeLocalities, trendingPosts] = await Promise.all([
    fetchTrendingTags(),
    fetchActiveLocalities(),
    fetchFeeds('trending', null, null, null, 5000, 1, 6) // page=1, limit=6
  ]);

  const recommendations = {
    tags: trendingTags,
    localities: activeLocalities,
    posts: trendingPosts
  };

  return (
    <div className="py-2 animate-fade-in">
      <div className="mb-6">
        <h1 className="sr-only">
          Search Local Communities & Discussions
        </h1>
        <h2 className="sr-only">
          Discover local communities, search local discussions, and find people near you.
        </h2>
        <SearchBar initialQuery={query} />
      </div>

      {query ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Search results for <span className="text-blue-primary">"{query}"</span>
          </h2>
          <SearchTabs results={results} query={query} recommendations={recommendations} />
        </div>
      ) : (
        <div className="mt-8">
          <SearchTabs results={null} query="" recommendations={recommendations} />
        </div>
      )}
    </div>
  );
}
