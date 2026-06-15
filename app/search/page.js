import SearchBar from '@/components/trending/SearchBar';
import SearchTabs from '@/components/search/SearchTabs';
import ExploreWidgets from '@/components/trending/ExploreWidgets';
import { generateMetadata } from '@/lib/seo';
import { searchPosts } from '@/app/actions/posts';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  exactTitle: 'Search Communities & Local Discussions | Rambhahoo',
  description: 'Search communities, discover local communities, and search local discussions happening right now on Rambhahoo.',
});

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';
  
  let results = { posts: [], users: [], localities: [] };
  if (query) {
    results = await searchPosts(query);
  }

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
          <SearchTabs results={results} query={query} />
        </div>
      ) : (
        <>
          <div className="mt-8 xl:hidden">
            <h2 className="text-xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-4 px-1">
              Explore
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ExploreWidgets />
            </div>
          </div>
          <div className="mt-12 text-center text-text-muted hidden xl:block">
            <p>Search for localities, tags, or topics to see what's happening.</p>
          </div>
        </>
      )}
    </div>
  );
}
