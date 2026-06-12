import SearchBar from '@/components/trending/SearchBar';
import SearchTabs from '@/components/search/SearchTabs';
import { generateMetadata } from '@/lib/seo';
import { searchPosts } from '@/app/actions/posts';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  title: 'Explore',
  description: 'Search for discussions, people, and topics in your neighborhood.',
});

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';
  
  let results = { posts: [], users: [], localities: [] };
  if (query) {
    results = await searchPosts(query);
  }

  return (
    <div className="py-4 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-4 hidden md:block">
          Explore
        </h1>
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
        <div className="mt-12 text-center text-text-muted">
          <p>Search for localities, tags, or topics to see what's happening.</p>
        </div>
      )}
    </div>
  );
}
