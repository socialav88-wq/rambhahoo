import { APP_URL } from '@/lib/constants';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/create',
        '/create-locality',
        '/settings',
        '/admin',
        '/private',
        '/drafts'
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
