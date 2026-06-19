import AdviceFeedContainer from '@/components/advice/AdviceFeedContainer';
import { generateMetadata } from '@/lib/seo';
import { fetchAdviceFeed } from '@/app/actions/advice';
import { getSession } from '@/app/actions/auth';

export const metadata = generateMetadata({
  title: 'Need Advice — Rambhahoo Support Community',
  description: 'Ask for help, career guidance, relationship advice, financial tips, and local recommendations from the Rambhahoo community.',
});

export const dynamic = 'force-dynamic';

export default async function AdviceLandingPage() {
  const initialPosts = await fetchAdviceFeed('new');
  const session = await getSession();
  const user = session?.user || null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border pb-4 hidden md:block hide-in-pwa">
        <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary tracking-tight">
          Need Advice Community
        </h1>
        <h2 className="text-text-muted text-sm md:text-base mt-1 leading-snug">
          Ask questions, get rated answers, and share guidance on career, relationships, local recommendations, and more.
        </h2>
      </div>
      <AdviceFeedContainer initialPosts={initialPosts} user={user} />
    </div>
  );
}
