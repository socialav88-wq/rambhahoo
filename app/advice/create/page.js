import CreateAdviceForm from '@/components/advice/CreateAdviceForm';
import { generateMetadata } from '@/lib/seo';
import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export const metadata = generateMetadata({
  title: 'Ask for Advice — Rambhahoo Support Community',
  description: 'Post your question and context anonymously or publicly to seek helpful community advice.',
  noindex: true
});

export const dynamic = 'force-dynamic';

export default async function CreateAdvicePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/advice/create');
  }

  return (
    <div className="py-4 animate-fade-in">
      <CreateAdviceForm />
    </div>
  );
}
