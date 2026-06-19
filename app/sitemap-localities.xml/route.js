import { APP_URL, LOCALITIES } from '@/lib/constants';

export async function GET() {
  const urls = [];

  // Base routes
  urls.push({ loc: APP_URL, changefreq: 'always', priority: '1.0' });
  urls.push({ loc: `${APP_URL}/search`, changefreq: 'hourly', priority: '0.8' });
  urls.push({ loc: `${APP_URL}/trending`, changefreq: 'hourly', priority: '0.8' });

  const tabs = ['discussions', 'recommendations', 'questions', 'news', 'events', 'trending'];

  // Localities and their tabs
  LOCALITIES.forEach((loc) => {
    // Core locality page
    urls.push({
      loc: `${APP_URL}/${loc.slug}`,
      changefreq: 'daily',
      priority: '0.9',
    });
    // Locality tabs
    tabs.forEach((tab) => {
      urls.push({
        loc: `${APP_URL}/${loc.slug}?tab=${tab}`,
        changefreq: 'daily',
        priority: '0.8',
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
