import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'Help Center',
  description: 'Get help with Rambhahoo. Frequently asked questions and support.',
});

export default function HelpPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: 'Help Center',
    description: 'Get help with Rambhahoo. Frequently asked questions and support.',
    url: `https://www.rambhahoo.com/${'help'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'Help Center', href: '/help' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">Help Center</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>How do I change my locality? You can change it in Settings. How do I delete a post? Click the trash icon on your post. If you need further assistance, please visit our Contact page.</p>
        </div>
      </div>
    </div>
  );
}
