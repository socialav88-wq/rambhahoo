import { APP_URL, LOCALITIES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const supabase = await createClient();
  
  // Base routes
  const routes = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${APP_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${APP_URL}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.8,
    },
  ];

  // Map localities natively
  LOCALITIES.forEach((loc) => {
    routes.push({
      url: `${APP_URL}/${loc.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  });

  // Fetch all posts efficiently
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at')
    .limit(50000);

  if (posts) {
    posts.forEach((post) => {
      routes.push({
        url: `${APP_URL}/post/${post.slug}`,
        lastModified: new Date(post.created_at),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    });
  }

  // Fetch all user profiles efficiently
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, updated_at, created_at')
    .limit(50000);

  if (profiles) {
    profiles.forEach((profile) => {
      routes.push({
        url: `${APP_URL}/profile/${profile.username}`,
        lastModified: new Date(profile.updated_at || profile.created_at || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });
  }

  return routes;
}
