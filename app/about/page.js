import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: 'About Us',
  description: 'Rambhahoo is Hyderabad\'s premier local social network connecting neighbors, discovering local news, and fostering meaningful community discussions.',
});

export default function AboutPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Us',
    description: 'Rambhahoo is Hyderabad\'s premier local social network connecting neighbors, discovering local news, and fostering meaningful community discussions.',
    url: `https://www.rambhahoo.com/${'about'}`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: 'About Us', href: '/about' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">About Us</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>Rambhahoo is built for Hyderabad. We believe in the power of hyper-local communities. Our mission is to connect neighbors, facilitate local commerce, and provide a platform for local news and discussions without the noise of global social media.</p>
        </div>
      </div>
    </div>
  );
}
