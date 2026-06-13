const fs = require('fs');
const path = require('path');

const pages = [
  { slug: 'about', title: 'About Us', schema: 'AboutPage', desc: 'Rambhahoo is Hyderabad\'s premier local social network connecting neighbors, discovering local news, and fostering meaningful community discussions.', content: 'Rambhahoo is built for Hyderabad. We believe in the power of hyper-local communities. Our mission is to connect neighbors, facilitate local commerce, and provide a platform for local news and discussions without the noise of global social media.' },
  { slug: 'privacy', title: 'Privacy Policy', schema: 'WebPage', desc: 'Read the Rambhahoo Privacy Policy to understand how we collect, use, and protect your data.', content: 'Your privacy is our priority. Rambhahoo collects minimal data necessary to operate the platform. We do not sell your personal data to third parties. All location data is strictly opt-in and used solely to connect you with your local community.' },
  { slug: 'terms', title: 'Terms of Service', schema: 'WebPage', desc: 'Rambhahoo Terms of Service and user agreement.', content: 'By using Rambhahoo, you agree to abide by our terms of service. You must be at least 13 years old. You retain ownership of your content, but grant us a license to distribute it on our platform. Do not post illegal or harmful content.' },
  { slug: 'guidelines', title: 'Community Guidelines', schema: 'WebPage', desc: 'Community Guidelines for keeping Rambhahoo safe, respectful, and local.', content: '1. Be respectful to your neighbors. 2. No hate speech or harassment. 3. Keep discussions relevant to the locality. 4. No spam or excessive self-promotion. We reserve the right to ban users who violate these guidelines.' },
  { slug: 'help', title: 'Help Center', schema: 'FAQPage', desc: 'Get help with Rambhahoo. Frequently asked questions and support.', content: 'How do I change my locality? You can change it in Settings. How do I delete a post? Click the trash icon on your post. If you need further assistance, please visit our Contact page.' },
  { slug: 'contact', title: 'Contact Us', schema: 'ContactPage', desc: 'Contact the Rambhahoo support team.', content: 'We would love to hear from you. For support, partnerships, or press inquiries, please email us at support@rambhahoo.com. We typically respond within 24-48 hours.' }
];

pages.forEach(p => {
  const dir = path.join(__dirname, '..', 'app', p.slug);
  fs.mkdirSync(dir, { recursive: true });
  
  const code = `import { generateMetadata } from '@/lib/seo';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata = generateMetadata({
  title: '${p.title}',
  description: '${p.desc}',
});

export default function ${p.slug.charAt(0).toUpperCase() + p.slug.slice(1)}Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': '${p.schema}',
    name: '${p.title}',
    description: '${p.desc}',
    url: \`https://www.rambhahoo.com/\${'${p.slug}'}\`
  };

  return (
    <div className="py-6 animate-fade-in max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Breadcrumbs items={[{ label: '${p.title}', href: '/${p.slug}' }]} />
      <div className="bg-bg-card border border-border rounded-xl p-8 mt-4 shadow-sm">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-poppins)] text-text-primary mb-6">${p.title}</h1>
        <div className="text-text-muted leading-relaxed space-y-4">
          <p>${p.content}</p>
        </div>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, 'page.js'), code);
});

console.log('Static pages generated successfully.');
