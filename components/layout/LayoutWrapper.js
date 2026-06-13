'use client';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children, mainLayout }) {
  const pathname = usePathname();
  
  // Public routes that should not have the sidebars/navbar of the main app
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <>{mainLayout}</>;
}
