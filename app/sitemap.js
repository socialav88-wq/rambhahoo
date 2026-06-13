import { APP_URL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const supabase = await createClient();
  
  // Base routes
  const routes = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
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

  // Fetch all posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, created_at');

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

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at');

  if (profiles) {
    profiles.forEach((profile) => {
      routes.push({
        url: `${APP_URL}/profile/${profile.username}`,
        lastModified: new Date(profile.created_at),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });
  }

  return routes;
}
