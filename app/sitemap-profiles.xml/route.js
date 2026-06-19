import { APP_URL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Query all profiles up to 50k for crawler indexing
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(profiles || [])
    .map(
      (p) => `  <url>
    <loc>${APP_URL}/profile/${p.username}</loc>
    <lastmod>${new Date(p.updated_at || p.created_at || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
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
