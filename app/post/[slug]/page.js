import { fetchPostBySlug } from '@/app/actions/posts';
import PostDetail from '@/components/post/PostDetail';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { generatePostMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return {};
  return generatePostMetadata(post, post.localities);
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  // Show proper 404 instead of wrong hardcoded post
  if (!post) notFound();

  return (
    <div className="animate-fade-in py-2">
      <Breadcrumbs items={[
        ...(post.localities ? [{ label: `${post.localities.name} Community`, href: `/${post.localities.slug}` }] : []),
        { label: post.title, href: `/post/${post.slug}` }
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DiscussionForumPosting',
            headline: post.title,
            articleBody: post.content || post.title,
            datePublished: post.created_at,
            author: {
              '@type': 'Person',
              name: post.profiles?.display_name || post.profiles?.username || 'Anonymous',
            },
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CommentAction',
              userInteractionCount: post.comment_count || 0,
            }
          })
        }}
      />
      <PostDetail post={post} />
    </div>
  );
}
