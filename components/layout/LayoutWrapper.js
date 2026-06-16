'use client';

import { usePathname } from 'next/navigation';
import AppAuthGuard from '@/components/auth/AppAuthGuard';

export default function LayoutWrapper({ children, mainLayout }) {
  const pathname = usePathname();
  
  // Public routes that should not have the sidebars/navbar of the main app
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isPublicRoute) {
    return (
      <>
        <AppAuthGuard />
        {children}
      </>
    );
  }

  return (
    <>
      <AppAuthGuard />
      {mainLayout}
    </>
  );
}
