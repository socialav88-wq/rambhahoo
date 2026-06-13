import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'Terms of Service',
  description: 'Rambhahoo Terms of Service and user agreement.',
});

export default function TermsPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    description: 'Rambhahoo Terms of Service and user agreement.',
    url: `https://www.rambhahoo.com/${'terms'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'Terms of Service', href: '/terms' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">Terms of Service</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>By using Rambhahoo, you agree to abide by our terms of service. You must be at least 13 years old. You retain ownership of your content, but grant us a license to distribute it on our platform. Do not post illegal or harmful content.</p>
        </div>
      </div>
    </div>
  );
}
