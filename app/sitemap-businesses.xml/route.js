import { APP_URL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Query all local businesses up to 50k
  const { data: businesses } = await supabase
    .from('businesses')
    .select('slug, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(businesses || [])
    .map(
      (b) => `  <url>
    <loc>${APP_URL}/business/${b.slug}</loc>
    <lastmod>${new Date(b.updated_at || b.created_at || new Date()).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
