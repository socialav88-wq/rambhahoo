import { APP_NAME, APP_DESCRIPTION, APP_URL } from './constants';

export function generateMetadata({ title, exactTitle, description, path = '', image, type = 'website', noindex = false }) {
  const fullTitle = exactTitle ? exactTitle : (title ? `${title} | ${APP_NAME}` : `${APP_NAME} - Discover What's Happening Around You`);
  const fullDescription = description || APP_DESCRIPTION;
  const url = `${APP_URL}${path}`;
  const ogImage = image || `${APP_URL}/og-default.png`;

  return {
    title: fullTitle,
    description: fullDescription,
    metadataBase: new URL(APP_URL),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: APP_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [ogImage],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generatePostMetadata(post, locality) {
  return generateMetadata({
    title: post.title,
    description: post.content ? post.content.substring(0, 160) : `${post.type} post in ${locality?.name || 'Rambhahoo'}`,
    path: `/post/${post.slug}`,
    type: 'article',
  });
}

export function generateLocalityMetadata(locality) {
  return generateMetadata({
    title: `${locality.name} Community`,
    description: locality.description,
    path: `/${locality.slug}`,
  });
}

export function generateProfileMetadata(profile) {
  return generateMetadata({
    title: profile.username,
    description: profile.bio || `${profile.display_name}'s profile on Rambhahoo`,
    path: `/profile/${profile.username}`,
    type: 'profile',
  });
}

export function generateJsonLd({ type = 'WebSite', name, description, url }) {
  if (type === 'WebSite') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: name || APP_NAME,
      description: description || APP_DESCRIPTION,
      url: url || APP_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${APP_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };
  }
  if (type === 'DiscussionForumPosting') {
    return {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: name,
      description,
      url,
    };
  }
  return null;
}
