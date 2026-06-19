'use client';

import { useState } from 'react';
import { getInitials } from '@/lib/utils';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const SIZE_DIMS = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const BACKGROUNDS = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-green-500 text-white',
  'bg-yellow-600 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
  'bg-indigo-500 text-white',
  'bg-teal-500 text-white',
  'bg-emerald-500 text-white',
  'bg-orange-500 text-white',
];

const getHashBackground = (str) => {
  if (!str) return BACKGROUNDS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BACKGROUNDS.length;
  return BACKGROUNDS[index];
};

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeClass = SIZES[size] || SIZES.md;
  const dim = SIZE_DIMS[size] || SIZE_DIMS.md;
  const [imgError, setImgError] = useState(false);
  
  const displayName = name || 'user';
  const showFallback = !src || imgError;

  return (
    <div className={`relative ${sizeClass} rounded-full overflow-hidden ring-2 ring-border-light shadow-sm shrink-0 flex items-center justify-center font-bold font-[family-name:var(--font-poppins)] transition-colors select-none ${className}`}>
      {showFallback ? (
        <div className={`w-full h-full flex items-center justify-center ${getHashBackground(displayName)}`}>
          {getInitials(displayName)}
        </div>
      ) : (
        <img
          src={src}
          alt={displayName}
          width={dim}
          height={dim}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
