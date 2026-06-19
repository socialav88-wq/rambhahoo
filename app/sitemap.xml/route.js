import { APP_URL } from '@/lib/constants';

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${APP_URL}/sitemap-localities.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${APP_URL}/sitemap-posts.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${APP_URL}/sitemap-questions.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${APP_URL}/sitemap-profiles.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${APP_URL}/sitemap-businesses.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
