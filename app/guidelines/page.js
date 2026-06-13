import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'Community Guidelines',
  description: 'Community Guidelines for keeping Rambhahoo safe, respectful, and local.',
});

export default function GuidelinesPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Community Guidelines',
    description: 'Community Guidelines for keeping Rambhahoo safe, respectful, and local.',
    url: `https://www.rambhahoo.com/${'guidelines'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'Community Guidelines', href: '/guidelines' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">Community Guidelines</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>1. Be respectful to your neighbors. 2. No hate speech or harassment. 3. Keep discussions relevant to the locality. 4. No spam or excessive self-promotion. We reserve the right to ban users who violate these guidelines.</p>
        </div>
      </div>
    </div>
  );
}
