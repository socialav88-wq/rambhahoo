'use client';

import { usePathname } from 'next/navigation';

export default function LayoutWrapper({ children, mainLayout }) {
  const pathname = usePathname();
  
  // Public routes that should not have the sidebars/navbar of the main app
  const isPublicRoute = pathname === '/login' || pathname === '/signup';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <>{mainLayout}</>;
}
