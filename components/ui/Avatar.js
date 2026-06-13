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
  
  const seed = encodeURIComponent(name || 'user');
  const avatarUrl = src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=e2e8f0,b6e3f4,c0aede,d1d4f9,ffdfbf&backgroundType=gradientLinear`;
  
  return (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden ring-2 ring-border-light shadow-sm shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
