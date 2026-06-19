import AdviceDetailContainer from '@/components/advice/AdviceDetailContainer';
import { generateMetadata } from '@/lib/seo';
import { fetchAdvicePostBySlug, fetchAdviceReplies } from '@/app/actions/advice';
import { getSession } from '@/app/actions/auth';
import { notFound } from 'next/navigation';

export async function generateMetadataForSlug({ params }) {
  const { slug } = await params;
  const post = await fetchAdvicePostBySlug(slug);
  if (!post) return {};
  
  return generateMetadata({
    title: `${post.title} — Need Advice`,
    description: post.content.substring(0, 150),
  });
}

export const dynamic = 'force-dynamic';

export default async function AdvicePostDetailPage({ params }) {
  const { slug } = await params;
  const post = await fetchAdvicePostBySlug(slug);
  if (!post) {
    notFound();
  }

  const replies = await fetchAdviceReplies(post.id);
  const session = await getSession();
  const user = session?.user || null;

  return (
    <div className="py-4 animate-fade-in">
      <AdviceDetailContainer 
        initialPost={post} 
        initialReplies={replies} 
        user={user} 
      />
    </div>
  );
}
