import { fetchPostBySlug } from '@/app/actions/posts';
import PostDetail from '@/components/post/PostDetail';
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
    <div className="animate-fade-in">
      <PostDetail post={post} />
    </div>
  );
}
