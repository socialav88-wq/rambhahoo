'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import PostHeader from './PostHeader';
import PostFooter from './PostFooter';

export default function ImageCard({ post, priority = false }) {
  const { title, image_url, slug, tags = [] } = post;
  const [imageError, setImageError] = useState(false);

  return (
    <article className="bg-bg-card border border-border hover-card rounded-3xl p-5 animate-fade-in relative">
      <PostHeader post={post} />

      {/* Image & Title Link */}
      <Link href={`/post/${slug}`} className="block group mt-2">
        <h2 className="text-base font-semibold text-text-primary group-hover:text-blue-primary transition-colors leading-snug mb-3 break-words">
          {title}
        </h2>
        
        {image_url && !imageError ? (
          <div className="w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-bg-elevated/50 backdrop-blur-sm border border-border shadow-sm relative">
            <Image
              src={image_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover hover:scale-105 transition-transform duration-500"
              priority={priority}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] rounded-2xl bg-bg-elevated flex items-center justify-center border border-border">
            <div className="flex flex-col items-center justify-center text-text-dim gap-1.5">
              <ImageIcon size={32} />
              {image_url && <span className="text-xs font-semibold">Image unavailable</span>}
            </div>
          </div>
        )}
      </Link>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      <PostFooter post={post} />
    </article>
  );
}
