import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'Privacy Policy',
  description: 'Read the Rambhahoo Privacy Policy to understand how we collect, use, and protect your data.',
});

export default function PrivacyPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy',
    description: 'Read the Rambhahoo Privacy Policy to understand how we collect, use, and protect your data.',
    url: `https://www.rambhahoo.com/${'privacy'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'Privacy Policy', href: '/privacy' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">Privacy Policy</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>Your privacy is our priority. Rambhahoo collects minimal data necessary to operate the platform. We do not sell your personal data to third parties. All location data is strictly opt-in and used solely to connect you with your local community.</p>
        </div>
      </div>
    </div>
  );
}
