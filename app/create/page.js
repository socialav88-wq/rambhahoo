import CreatePostForm from '@/components/post/CreatePostForm';
import { generateMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  title: 'Create Post',
  description: 'Start a discussion, share a meme, or ask your neighborhood.',
});


export default function CreatePage() {
  return (
    <div className="py-4 animate-fade-in">
      <CreatePostForm />
    </div>
  );
}
