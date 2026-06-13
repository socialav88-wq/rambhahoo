'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  const schemaList = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 2,
    name: item.label,
    item: `https://www.rambhahoo.com${item.href}`
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.rambhahoo.com/'
      },
      ...schemaList
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm text-text-muted overflow-x-auto whitespace-nowrap scrollbar-hide">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-blue-primary transition-colors flex items-center">
              <Home size={16} />
              <span className="sr-only">Home</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href || index} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-border" />
              {index === items.length - 1 ? (
                <span className="text-text-primary font-medium truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-blue-primary transition-colors truncate max-w-[150px]">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
