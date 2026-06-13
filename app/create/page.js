import CreatePostForm from '@/components/post/CreatePostForm';
import { generateMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = generateMetadata({
  title: 'Create Post',
  description: 'Start a discussion, share a meme, or ask your neighborhood.',
  noindex: true,
});

import { Suspense } from 'react';

export default function CreatePage() {
  return (
    <div className="py-4 animate-fade-in">
      <Suspense fallback={<div className="p-8 text-center text-text-dim">Loading form...</div>}>
        <CreatePostForm />
      </Suspense>
    </div>
  );
}
