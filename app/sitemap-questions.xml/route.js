import { APP_URL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at, updated_at')
    .eq('is_indexable', true)
    .eq('category', 'question')
    .order('created_at', { ascending: false })
    .limit(50000);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${(posts || [])
    .map(
      (post) => `  <url>
    <loc>${APP_URL}/post/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || post.created_at).toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
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
