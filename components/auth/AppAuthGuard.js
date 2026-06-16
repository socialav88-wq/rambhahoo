'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AppAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuthStore();
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as PWA (installed app)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsStandalone(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isStandalone && !user && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
      router.replace('/login');
    }
  }, [isLoading, isStandalone, user, pathname, router]);

  return null;
}
