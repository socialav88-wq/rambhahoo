import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'Contact Us',
  description: 'Contact the Rambhahoo support team.',
});

export default function ContactPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Us',
    description: 'Contact the Rambhahoo support team.',
    url: `https://www.rambhahoo.com/${'contact'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'Contact Us', href: '/contact' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">Contact Us</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>We would love to hear from you. For support, partnerships, or press inquiries, please email us at support@rambhahoo.com. We typically respond within 24-48 hours.</p>
        </div>
      </div>
    </div>
  );
}
