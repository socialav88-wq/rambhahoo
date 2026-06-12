'use client';

import { getInitials } from '@/lib/utils';
import Image from 'next/image';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  
  if (src) {
    return (
      <div className={`relative ${sizeClass} rounded-full overflow-hidden ring-2 ring-border-light shadow-sm shrink-0 ${className}`}>
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          sizes="(max-width: 768px) 10vw, 5vw"
          className="object-cover"
        />
      </div>
    );
  }
  
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-primary to-purple-secondary flex items-center justify-center font-semibold text-white ring-2 ring-white shadow-sm ${className}`}>
      {getInitials(name)}
    </div>
  );
}
